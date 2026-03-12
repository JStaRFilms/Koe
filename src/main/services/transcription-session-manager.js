const path = require('path');
const { Worker } = require('worker_threads');
const { CHANNELS } = require('../../shared/constants');
const { getSettings } = require('./settings');
const { autoPaste, writeToClipboard } = require('./clipboard');
const historyService = require('./history');
const rateLimiter = require('./rate-limiter');
const pendingRetryService = require('./pending-retry');
const logger = require('./logger');

function joinTranscriptParts(parts) {
    return parts
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+([,.;!?])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function safeAudioSeconds(value) {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric : 0;
}

class TranscriptionSessionManager {
    constructor() {
        this.mainWindow = null;
        this.sessions = new Map();
        this.worker = null;
        this.workerReady = false;
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

    createSession(sessionId, settings = getSettings()) {
        const session = {
            sessionId,
            settings: {
                groqApiKey: settings.groqApiKey || '',
                language: settings.language || 'auto',
                promptStyle: settings.promptStyle || 'Clean',
                customPrompt: settings.customPrompt || '',
                model: settings.model || 'whisper-large-v3-turbo',
                enhanceText: true,
                autoPaste: settings.autoPaste !== false
            },
            segments: new Map(),
            nextSequenceToCommit: 0,
            stopRequested: false,
            finalized: false,
            flushing: false,
            failureError: null,
            pendingRetrySaved: false,
            committedRawParts: [],
            committedRefinedParts: [],
            createdAt: Date.now()
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    getOrCreateSession(sessionId, settings = getSettings()) {
        return this.sessions.get(sessionId) || this.createSession(sessionId, settings);
    }

    sendStatus(status) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        this.mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, status);
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
        this.ensureWorker();

        const settings = getSettings();
        const session = this.getOrCreateSession(audioData.sessionId, settings);
        const segment = {
            sessionId: audioData.sessionId,
            segmentId: audioData.segmentId,
            sequence: audioData.sequence,
            audioSeconds: safeAudioSeconds(audioData.audioSeconds),
            status: 'queued',
            buffer: audioData.buffer,
            rawText: '',
            refinedText: '',
            tempPath: null,
            error: null
        };

        session.segments.set(segment.sequence, segment);
        this.worker.postMessage({
            type: 'process-segment',
            payload: {
                sessionId: segment.sessionId,
                segmentId: segment.segmentId,
                sequence: segment.sequence,
                audioSeconds: segment.audioSeconds,
                buffer: segment.buffer,
                options: session.settings
            }
        });
    }

    async handleSessionStopped(sessionId) {
        const session = this.sessions.get(sessionId);
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
        await this.flushReadySegments(session);
        await this.updatePostStopState(session);
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
            await this.handleSegmentResult(message);
            return;
        }

        if (message.type === 'segment-error') {
            await this.handleSegmentError(message);
        }
    }

    async handleSegmentResult(message) {
        const session = this.sessions.get(message.sessionId);
        if (!session) {
            return;
        }

        const segment = session.segments.get(message.sequence);
        if (!segment) {
            return;
        }

        segment.rawText = String(message.rawText || '').trim();
        segment.refinedText = String(message.refinedText || '').trim();
        segment.error = null;
        segment.status = message.empty ? 'empty' : 'ready';

        await this.flushReadySegments(session);
        await this.updatePostStopState(session);
    }

    async handleSegmentError(message) {
        const session = this.sessions.get(message.sessionId);
        if (!session) {
            return;
        }

        const segment = session.segments.get(message.sequence);
        if (!segment) {
            return;
        }

        segment.status = 'failed';
        segment.error = String(message.error || 'Segment processing failed.');
        session.failureError = segment.error;

        await this.persistRetryManifest(session);

        if (!session.stopRequested) {
            this.sendStatus({
                sessionId: session.sessionId,
                stage: 'warning',
                label: 'Retry Needed Later',
                detail: 'A segment failed. Keep talking. Retry after you stop if needed.'
            });
            return;
        }

        await this.updatePostStopState(session);
    }

    getOrderedSequences(session) {
        return Array.from(session.segments.keys()).sort((left, right) => left - right);
    }

    async flushReadySegments(session) {
        if (session.flushing) {
            return;
        }

        session.flushing = true;

        try {
            while (true) {
                const segment = session.segments.get(session.nextSequenceToCommit);
                if (!segment) {
                    break;
                }

                if (segment.status === 'failed') {
                    break;
                }

                if (segment.status !== 'ready' && segment.status !== 'empty') {
                    break;
                }

                if (segment.status === 'ready') {
                    if (segment.rawText) {
                        session.committedRawParts.push(segment.rawText);
                    }

                    if (segment.refinedText) {
                        session.committedRefinedParts.push(segment.refinedText);
                        if (session.settings.autoPaste) {
                            await autoPaste(segment.refinedText);
                        }
                    }
                }

                segment.status = 'committed';
                segment.buffer = null;
                segment.error = null;
                pendingRetryService.removeTempFile(segment.tempPath);
                segment.tempPath = null;
                session.nextSequenceToCommit += 1;
            }
        } finally {
            session.flushing = false;
        }
    }

    getProcessingCounts(session) {
        let committed = 0;
        let unresolved = 0;

        for (const segment of session.segments.values()) {
            if (segment.status === 'committed' || segment.status === 'empty') {
                committed += 1;
                continue;
            }

            unresolved += 1;
        }

        return {
            total: session.segments.size,
            committed,
            unresolved
        };
    }

    isSessionSettled(session) {
        for (const segment of session.segments.values()) {
            if (segment.status === 'queued' || segment.status === 'processing') {
                return false;
            }
        }

        return true;
    }

    hasBlockingFailure(session) {
        for (const segment of session.segments.values()) {
            if (segment.status === 'failed') {
                return true;
            }
        }

        return false;
    }

    async updatePostStopState(session) {
        if (!session.stopRequested || session.finalized) {
            return;
        }

        const counts = this.getProcessingCounts(session);

        if (!this.isSessionSettled(session)) {
            const progress = counts.total > 0
                ? Math.max(20, Math.min(96, Math.round((counts.committed / counts.total) * 100)))
                : 30;

            this.sendStatus({
                sessionId: session.sessionId,
                stage: 'processing',
                label: 'Finalizing',
                progress
            });
            return;
        }

        if (this.hasBlockingFailure(session)) {
            await this.persistRetryManifest(session);
            this.sendStatus({
                sessionId: session.sessionId,
                stage: 'error',
                error: session.failureError || 'Some segments failed. Retry to finish the transcript.',
                retryAvailable: true,
                lingerMs: 6500
            });
            return;
        }

        await this.finalizeSession(session);
    }

    async finalizeSession(session) {
        if (session.finalized) {
            return;
        }

        session.finalized = true;
        const rawText = joinTranscriptParts(session.committedRawParts);
        const refinedText = joinTranscriptParts(session.committedRefinedParts);

        if (!rawText && !refinedText) {
            pendingRetryService.clearPendingRetry();
            this.sendStatus({
                sessionId: session.sessionId,
                stage: 'empty',
                label: 'No speech detected',
                progress: 0
            });
            this.sessions.delete(session.sessionId);
            return;
        }

        writeToClipboard(refinedText || rawText);
        historyService.addHistoryEntry({
            rawText,
            refinedText: refinedText || rawText,
            language: session.settings.language || 'auto',
            isLlamaEnhanced: true,
            source: 'transcription'
        });

        pendingRetryService.clearPendingRetry();
        this.sendUsageStats();
        this.sendComplete({
            text: refinedText || rawText,
            sessionId: session.sessionId
        });
        this.sessions.delete(session.sessionId);
    }

    buildRetryManifest(session) {
        const committedSegments = [];
        const unresolvedSegments = [];
        const orderedSequences = this.getOrderedSequences(session);

        for (const sequence of orderedSequences) {
            const segment = session.segments.get(sequence);
            if (!segment) {
                continue;
            }

            if (segment.status === 'committed' || segment.status === 'empty') {
                committedSegments.push({
                    sequence: segment.sequence,
                    rawText: segment.rawText || '',
                    refinedText: segment.refinedText || ''
                });
                continue;
            }

            unresolvedSegments.push({
                sequence: segment.sequence,
                segmentId: segment.segmentId,
                audioSeconds: segment.audioSeconds,
                status: segment.status,
                rawText: segment.status === 'ready' ? (segment.rawText || '') : '',
                refinedText: segment.status === 'ready' ? (segment.refinedText || '') : '',
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
        const liveSession = Array.from(this.sessions.values()).find((session) => this.hasBlockingFailure(session));

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
            enhanceText: true
        };
        session.nextSequenceToCommit = Number(manifest.nextSequenceToCommit || 0);
        session.committedRawParts = manifest.committedSegments
            .slice()
            .sort((left, right) => left.sequence - right.sequence)
            .map((segment) => segment.rawText || '')
            .filter(Boolean);
        session.committedRefinedParts = manifest.committedSegments
            .slice()
            .sort((left, right) => left.sequence - right.sequence)
            .map((segment) => segment.refinedText || '')
            .filter(Boolean);

        for (const committed of manifest.committedSegments || []) {
            session.segments.set(committed.sequence, {
                sessionId: session.sessionId,
                segmentId: `committed-${committed.sequence}`,
                sequence: committed.sequence,
                audioSeconds: 0,
                status: 'committed',
                buffer: null,
                rawText: committed.rawText || '',
                refinedText: committed.refinedText || '',
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
                refinedText: unresolved.refinedText || '',
                tempPath: unresolved.tempPath || null,
                error: unresolved.error || null
            });
        }

        await this.retrySession(session, options);
        return {
            source: 'pending-session',
            sessionId: session.sessionId
        };
    }

    async retrySession(session, options = {}) {
        const retryableSegments = this.getOrderedSequences(session)
            .map((sequence) => session.segments.get(sequence))
            .filter((segment) => segment && segment.status === 'failed');

        if (retryableSegments.length === 0) {
            await this.flushReadySegments(session);
            await this.updatePostStopState(session);
            return;
        }

        session.failureError = null;
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

        await this.flushReadySegments(session);
        await this.updatePostStopState(session);
    }
}

module.exports = new TranscriptionSessionManager();
