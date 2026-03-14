import { TranscriptionSession, TranscriptionSegment, SegmentStatus } from '../types/session';
import { joinTranscriptParts } from '../utils/text';

export interface CoordinatorHooks {
    onStatus: (status: any) => void;
    onPreview: (payload: any) => void;
    onProcessSegment: (payload: any) => void;
    onRefineSession: (payload: any) => void;
    onFinalize: (session: TranscriptionSession, text: string, isEnhanced: boolean) => Promise<void>;
    onPersistRetry: (session: TranscriptionSession) => Promise<void>;
    onSegmentCommitted?: (session: TranscriptionSession, segment: TranscriptionSegment) => Promise<void> | void;
}

export class SessionCoordinator {
    private sessions: Map<string, TranscriptionSession> = new Map();
    private hooks: CoordinatorHooks;

    constructor(hooks: CoordinatorHooks) {
        this.hooks = hooks;
    }

    createSession(sessionId: string, settings: any): TranscriptionSession {
        const session: TranscriptionSession = {
            sessionId,
            settings,
            segments: new Map(),
            nextSequenceToCommit: 0,
            stopRequested: false,
            finalized: false,
            flushing: false,
            failureError: null,
            pendingRetrySaved: false,
            committedRawParts: [],
            finalRawText: '',
            finalRefinementRequested: false,
            finalRefinementPending: false,
            createdAt: Date.now()
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    getSession(sessionId: string): TranscriptionSession | undefined {
        return this.sessions.get(sessionId);
    }

    findSessionWithBlockingFailure(): TranscriptionSession | undefined {
        return Array.from(this.sessions.values()).find((session) => this.hasBlockingFailure(session));
    }

    deleteSession(sessionId: string) {
        this.sessions.delete(sessionId);
    }

    async addSegment(session: TranscriptionSession, segmentData: any) {
        const segment: TranscriptionSegment = {
            sessionId: session.sessionId,
            segmentId: segmentData.segmentId,
            sequence: segmentData.sequence,
            audioSeconds: segmentData.audioSeconds,
            status: 'queued',
            buffer: segmentData.buffer,
            rawText: '',
            tempPath: null,
            error: null
        };

        session.segments.set(segment.sequence, segment);
        
        this.hooks.onProcessSegment({
            sessionId: segment.sessionId,
            segmentId: segment.segmentId,
            sequence: segment.sequence,
            audioSeconds: segment.audioSeconds,
            buffer: segment.buffer,
            options: session.settings
        });
    }

    async handleSegmentResult(sessionId: string, sequence: number, rawText: string, empty: boolean) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const segment = session.segments.get(sequence);
        if (!segment) return;

        segment.rawText = String(rawText || '').trim();
        segment.error = null;
        segment.status = empty ? 'empty' : 'ready';

        await this.flushReadySegments(session);
        await this.updatePostStopState(session);
    }

    async handleSegmentError(sessionId: string, sequence: number, error: string) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const segment = session.segments.get(sequence);
        if (!segment) return;

        segment.status = 'failed';
        segment.error = String(error || 'Segment processing failed.');
        session.failureError = segment.error;

        await this.hooks.onPersistRetry(session);

        if (!session.stopRequested) {
            this.hooks.onStatus({
                sessionId: session.sessionId,
                stage: 'warning',
                label: 'Retry Needed Later',
                detail: 'A chunk failed. Keep talking. Retry after you stop if needed.'
            });
            return;
        }

        await this.updatePostStopState(session);
    }

    async flushReadySegments(session: TranscriptionSession) {
        if (session.flushing) return;

        session.flushing = true;
        let committedAny = false;

        try {
            while (true) {
                const segment = session.segments.get(session.nextSequenceToCommit);
                if (!segment) break;
                if (segment.status === 'failed') break;
                if (segment.status !== 'ready' && segment.status !== 'empty') break;

                if (segment.status === 'ready' && segment.rawText) {
                    session.committedRawParts.push(segment.rawText);
                    committedAny = true;
                }

                segment.status = 'committed';
                segment.buffer = null;
                segment.error = null;
                await this.hooks.onSegmentCommitted?.(session, segment);
                session.nextSequenceToCommit += 1;
            }
        } finally {
            session.flushing = false;
        }

        if (committedAny) {
            this.hooks.onPreview({
                sessionId: session.sessionId,
                text: joinTranscriptParts(session.committedRawParts)
            });
        }
    }

    async updatePostStopState(session: TranscriptionSession) {
        if (!session.stopRequested || session.finalized) return;

        if (!this.isSessionSettled(session)) {
            const counts = this.getProcessingCounts(session);
            const progress = counts.total > 0
                ? Math.max(20, Math.min(78, Math.round((counts.committed / counts.total) * 100)))
                : 24;

            this.hooks.onStatus({
                sessionId: session.sessionId,
                stage: 'processing',
                label: 'Finishing up',
                progress
            });
            return;
        }

        if (this.hasBlockingFailure(session)) {
            await this.hooks.onPersistRetry(session);
            this.hooks.onStatus({
                sessionId: session.sessionId,
                stage: 'error',
                error: session.failureError || 'Some chunks failed. Retry to finish the transcript.',
                detail: 'The last unsent recording is ready to resend.',
                retryAvailable: true,
                lingerMs: 6500
            });
            return;
        }

        await this.requestFinalRefinement(session);
    }

    private async requestFinalRefinement(session: TranscriptionSession) {
        if (session.finalRefinementPending) {
            this.hooks.onStatus({
                sessionId: session.sessionId,
                stage: 'refining',
                label: 'Refining',
                progress: 90
            });
            return;
        }

        if (session.finalRefinementRequested) return;

        const rawText = joinTranscriptParts(session.committedRawParts);
        session.finalRawText = rawText;

        if (!rawText) {
            this.hooks.onPreview({ sessionId: session.sessionId, text: '' });
            this.hooks.onStatus({
                sessionId: session.sessionId,
                stage: 'empty',
                label: 'No speech detected',
                progress: 0
            });
            this.deleteSession(session.sessionId);
            return;
        }

        if (!session.settings.enhanceText) {
            await this.hooks.onFinalize(session, rawText, false);
            return;
        }

        session.finalRefinementRequested = true;
        session.finalRefinementPending = true;
        this.hooks.onStatus({
            sessionId: session.sessionId,
            stage: 'refining',
            label: 'Polishing',
            progress: 90
        });

        this.hooks.onRefineSession({
            sessionId: session.sessionId,
            rawText,
            options: session.settings
        });
    }

    isSessionSettled(session: TranscriptionSession): boolean {
        for (const segment of session.segments.values()) {
            if (segment.status === 'queued' || segment.status === 'processing') {
                return false;
            }
        }
        return true;
    }

    hasBlockingFailure(session: TranscriptionSession): boolean {
        for (const segment of session.segments.values()) {
            if (segment.status === 'failed') return true;
        }
        return false;
    }

    getProcessingCounts(session: TranscriptionSession) {
        let committed = 0;
        let unresolved = 0;
        for (const segment of session.segments.values()) {
            if (segment.status === 'committed' || segment.status === 'empty') {
                committed += 1;
            } else {
                unresolved += 1;
            }
        }
        return { total: session.segments.size, committed, unresolved };
    }
}
