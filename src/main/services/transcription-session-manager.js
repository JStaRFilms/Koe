const { 
    SessionCoordinator, 
    joinTranscriptParts, 
    safeAudioSeconds 
} = require('@koe/core');
const path = require('path');
const { Worker } = require('worker_threads');
const { CHANNELS } = require('../../shared/constants');
const { getSettings } = require('./settings');
const { autoPaste, writeToClipboard } = require('./clipboard');
const { Notification } = require('electron');
const emailService = require('./email-service');
const historyService = require('./history');
const rateLimiter = require('./rate-limiter');
const pendingRetryService = require('./pending-retry');
const logger = require('./logger');

// Logic moved to @koe/core

class TranscriptionSessionManager {
    constructor() {
        this.mainWindow = null;
        this.worker = null;
        this.workerReady = false;

        // Shared coordinator with Electron hooks
        this.coordinator = new SessionCoordinator({
            onStatus: (status) => this.sendStatus(status),
            onPreview: (payload) => this.sendPreview(payload),
            onProcessSegment: (payload) => {
                this.ensureWorker();
                this.worker.postMessage({
                    type: 'process-segment',
                    payload
                });
            },
            onRefineSession: (payload) => {
                this.ensureWorker();
                this.worker.postMessage({
                    type: 'refine-session',
                    payload
                });
            },
            onFinalize: async (session, text, isEnhanced) => {
                await this.finalizeSuccessfulSession(session, text, isEnhanced);
            },
            onPersistRetry: async (session) => {
                await this.persistRetryManifest(session);
            },
            onSegmentCommitted: async (_session, segment) => {
                pendingRetryService.removeTempFile(segment.tempPath);
                segment.tempPath = null;
            }
        });
    }

    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.ensureWorker();
    }

    ensureWorker() {
        if (this.worker) {
            return;
        }

        const workerPath = path.join(__dirname, 'transcription-worker.js');
        this.worker = new Worker(workerPath);
        this.workerReady = true;

        this.worker.on('message', (message) => {
            this.handleWorkerMessage(message).catch((error) => {
                logger.error('[SessionManager] Worker message handling failed:', error);
            });
        });

        this.worker.on('error', (error) => {
            logger.error('[SessionManager] Worker failed:', error);
            this.workerReady = false;
        });

        this.worker.on('exit', (code) => {
            logger.warn(`[SessionManager] Worker exited with code ${code}.`);
            this.worker = null;
            this.workerReady = false;
        });
    }

    shutdown() {
        if (this.worker) {
            this.worker.terminate().catch(() => {});
            this.worker = null;
            this.workerReady = false;
        }
    }

    createSession(sessionId, settings = getSettings(), overrides = {}) {
        const sessionSettings = {
            groqApiKey: settings.groqApiKey || '',
            language: settings.language || 'auto',
            promptStyle: overrides.promptStyle || settings.promptStyle || 'Clean',
            customPrompt: settings.customPrompt || '',
            model: settings.model || 'whisper-large-v3-turbo',
            enhanceText: settings.enhanceText !== false,
            autoPaste: settings.autoPaste !== false
        };

        return this.coordinator.createSession(sessionId, sessionSettings);
    }

    getOrCreateSession(sessionId, settings = getSettings(), overrides = {}) {
        return this.coordinator.getSession(sessionId) || this.createSession(sessionId, settings, overrides);
    }

    sendStatus(status) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        this.mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, status);
    }

    sendPreview(payload) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        this.mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_PREVIEW, payload);
    }

    sendComplete(payload) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        this.mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, payload.text || '');
        this.mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, payload);
    }

    sendUsageStats() {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        this.mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
    }

    async handleSegment(audioData) {
        const settings = getSettings();
        const session = this.getOrCreateSession(audioData.sessionId, settings, audioData.overrides);
        await this.coordinator.addSegment(session, audioData);
    }

    async handleSessionStopped(sessionId) {
        const session = this.coordinator.getSession(sessionId);
        if (!session) {
            this.sendStatus({
                sessionId,
                stage: 'empty',
                label: 'Nothing captured',
                progress: 0
            });
            return;
        }

        session.stopRequested = true;
        await this.coordinator.flushReadySegments(session);
        await this.coordinator.updatePostStopState(session);
    }

    async handleWorkerMessage(message) {
        if (!message || !message.type) {
            return;
        }

        if (message.type === 'usage-recorded') {
            rateLimiter.recordRequest(safeAudioSeconds(message.audioSeconds));
            this.sendUsageStats();
            return;
        }

        if (message.type === 'segment-result') {
            await this.coordinator.handleSegmentResult(
                message.sessionId, 
                message.sequence, 
                message.rawText, 
                !!message.empty
            );
            return;
        }

        if (message.type === 'segment-error') {
            await this.coordinator.handleSegmentError(
                message.sessionId, 
                message.sequence, 
                message.error
            );
            return;
        }

        if (message.type === 'session-refined') {
            await this.handleSessionRefined(message);
            return;
        }

        if (message.type === 'session-refine-error') {
            await this.handleSessionRefineError(message);
        }
    }

    // Handlers moved to @koe/core coordinator

    async handleSessionRefined(message) {
        const session = this.coordinator.getSession(message.sessionId);
        if (!session || session.finalized) {
            return;
        }

        session.finalRefinementPending = false;
        await this.finalizeSuccessfulSession(session, String(message.refinedText || '').trim());
    }

    async handleSessionRefineError(message) {
        const session = this.coordinator.getSession(message.sessionId);
        if (!session || session.finalized) {
            return;
        }

        session.finalRefinementPending = false;
        await this.finalizeWithRawFallback(session, String(message.error || 'Session refinement failed.'));
    }

    // Helpers moved to @koe/core

    // Session flow control moved to @koe/core coordinator

    // Refinement moved to @koe/core coordinator

    async finalizeSuccessfulSession(session, refinedText, isEnhanced = true) {
        if (session.finalized) {
            return;
        }

        session.finalized = true;
        const rawText = session.finalRawText || joinTranscriptParts(session.committedRawParts);
        const outputText = String(refinedText || '').trim() || rawText;

        writeToClipboard(outputText);
        if (session.settings.autoPaste) {
            await autoPaste(outputText);
        }

        if (session.settings.promptStyle === 'Meeting Notes') {
            const settings = getSettings();

            const notification = new Notification({
                title: 'Koe - Meeting Summary Ready',
                body: outputText.slice(0, 100) + '...',
                silent: false
            });
            notification.show();

            if (settings.sendEmailSummaries && settings.userEmail) {
                emailService.sendMeetingSummary(settings.userEmail, outputText);
            }
        }

        historyService.addHistoryEntry({
            rawText,
            refinedText: outputText,
            language: session.settings.language || 'auto',
            isLlamaEnhanced: isEnhanced,
            source: 'transcription'
        });

        pendingRetryService.clearPendingRetry();
        this.sendUsageStats();
        this.sendPreview({
            sessionId: session.sessionId,
            text: ''
        });
        this.sendComplete({
            text: outputText,
            sessionId: session.sessionId
        });
        this.coordinator.deleteSession(session.sessionId);
    }

    async finalizeWithRawFallback(session, errorMessage) {
        if (session.finalized) {
            return;
        }

        session.finalized = true;
        const rawText = session.finalRawText || joinTranscriptParts(session.committedRawParts);

        if (!rawText) {
            pendingRetryService.clearPendingRetry();
            this.sendPreview({
                sessionId: session.sessionId,
                text: ''
            });
            this.sendStatus({
                sessionId: session.sessionId,
                stage: 'error',
                error: errorMessage,
                retryAvailable: false,
                lingerMs: 4500
            });
            this.coordinator.deleteSession(session.sessionId);
            return;
        }

        writeToClipboard(rawText);
        if (session.settings.autoPaste) {
            await autoPaste(rawText);
        }

        historyService.addHistoryEntry({
            rawText,
            refinedText: rawText,
            language: session.settings.language || 'auto',
            isLlamaEnhanced: false,
            source: 'transcription'
        });

        pendingRetryService.clearPendingRetry();
        this.sendUsageStats();
        this.sendPreview({
            sessionId: session.sessionId,
            text: ''
        });
        this.sendStatus({
            sessionId: session.sessionId,
            stage: 'error',
            error: errorMessage,
            detail: 'Raw transcript pasted. Final session retry is available.',
            retryAvailable: true,
            lingerMs: 6500
        });
        this.coordinator.deleteSession(session.sessionId);
    }

    buildRetryManifest(session) {
        const committedSegments = [];
        const unresolvedSegments = [];
        const orderedSequences = Array.from(session.segments.keys()).sort((left, right) => left - right);

        for (const sequence of orderedSequences) {
            const segment = session.segments.get(sequence);
            if (!segment) {
                continue;
            }

            if (segment.status === 'committed' || segment.status === 'empty') {
                committedSegments.push({
                    sequence: segment.sequence,
                    rawText: segment.rawText || ''
                });
                continue;
            }

            unresolvedSegments.push({
                sequence: segment.sequence,
                segmentId: segment.segmentId,
                audioSeconds: segment.audioSeconds,
                status: segment.status,
                rawText: segment.status === 'ready' ? (segment.rawText || '') : '',
                tempPath: segment.tempPath || null,
                error: segment.error || null
            });
        }

        return {
            sessionId: session.sessionId,
            nextSequenceToCommit: session.nextSequenceToCommit,
            settings: session.settings,
            committedSegments,
            unresolvedSegments,
            lastError: session.failureError || null,
            updatedAt: Date.now()
        };
    }

    async persistRetryManifest(session) {
        if (!session) {
            return;
        }

        for (const segment of session.segments.values()) {
            const needsAudioPersistence = (
                segment.status === 'failed' ||
                segment.status === 'queued' ||
                segment.status === 'processing'
            ) && segment.buffer;

            if (!needsAudioPersistence || segment.tempPath) {
                continue;
            }

            segment.tempPath = pendingRetryService.persistSegmentAudio(
                session.sessionId,
                segment.sequence,
                segment.buffer
            );

            segment.buffer = null;
        }

        const manifest = this.buildRetryManifest(session);
        pendingRetryService.savePendingRetryManifest(manifest);
        session.pendingRetrySaved = true;
    }

    async retryPendingSession(options = {}) {
        const liveSession = this.coordinator.findSessionWithBlockingFailure();

        if (liveSession) {
            await this.retrySession(liveSession, options);
            return {
                source: 'pending-session',
                sessionId: liveSession.sessionId
            };
        }

        const manifest = pendingRetryService.getPendingRetry();
        if (!manifest) {
            return null;
        }

        const session = this.createSession(manifest.sessionId, manifest.settings);
        session.stopRequested = true;
        session.settings = {
            ...session.settings,
            ...manifest.settings,
            enhanceText: manifest.settings?.enhanceText !== false
        };
        session.nextSequenceToCommit = Number(manifest.nextSequenceToCommit || 0);
        session.committedRawParts = (manifest.committedSegments || [])
            .slice()
            .sort((left, right) => left.sequence - right.sequence)
            .map((segment) => segment.rawText || '')
            .filter(Boolean);
        session.finalRawText = joinTranscriptParts(session.committedRawParts);

        for (const committed of manifest.committedSegments || []) {
            session.segments.set(committed.sequence, {
                sessionId: session.sessionId,
                segmentId: `committed-${committed.sequence}`,
                sequence: committed.sequence,
                audioSeconds: 0,
                status: 'committed',
                buffer: null,
                rawText: committed.rawText || '',
                tempPath: null,
                error: null
            });
        }

        for (const unresolved of manifest.unresolvedSegments || []) {
            session.segments.set(unresolved.sequence, {
                sessionId: session.sessionId,
                segmentId: unresolved.segmentId || `retry-${unresolved.sequence}`,
                sequence: unresolved.sequence,
                audioSeconds: safeAudioSeconds(unresolved.audioSeconds),
                status: unresolved.status === 'ready' ? 'ready' : 'failed',
                buffer: null,
                rawText: unresolved.rawText || '',
                tempPath: unresolved.tempPath || null,
                error: unresolved.error || null
            });
        }

        this.sendPreview({
            sessionId: session.sessionId,
            text: joinTranscriptParts(session.committedRawParts)
        });
        await this.retrySession(session, options);
        return {
            source: 'pending-session',
            sessionId: session.sessionId
        };
    }

    async retrySession(session, options = {}) {
        const retryableSegments = Array.from(session.segments.keys())
            .sort((left, right) => left - right)
            .map((sequence) => session.segments.get(sequence))
            .filter((segment) => segment && segment.status === 'failed');

        if (retryableSegments.length === 0) {
            await this.coordinator.flushReadySegments(session);
            await this.coordinator.updatePostStopState(session);
            return;
        }

        session.failureError = null;
        session.finalRefinementRequested = false;
        session.finalRefinementPending = false;
        this.sendStatus({
            sessionId: session.sessionId,
            stage: 'retrying',
            label: 'Retrying',
            progress: 18,
            forceDisplay: true
        });

        for (const segment of retryableSegments) {
            const buffer = segment.buffer || pendingRetryService.readTempAudio(segment.tempPath);
            if (!buffer) {
                throw new Error(`Retry audio for segment ${segment.sequence} is missing.`);
            }

            segment.status = 'queued';
            segment.error = null;
            segment.buffer = null;

            this.worker.postMessage({
                type: 'process-segment',
                payload: {
                    sessionId: session.sessionId,
                    segmentId: segment.segmentId,
                    sequence: segment.sequence,
                    audioSeconds: segment.audioSeconds,
                    buffer,
                    options: session.settings
                }
            });
        }

        await this.coordinator.flushReadySegments(session);
        await this.coordinator.updatePostStopState(session);
    }
}

module.exports = new TranscriptionSessionManager();
