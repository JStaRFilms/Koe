export type SegmentStatus = 'queued' | 'processing' | 'ready' | 'empty' | 'failed' | 'committed';

export interface TranscriptionSegment {
    sessionId: string;
    segmentId: string;
    sequence: number;
    audioSeconds: number;
    status: SegmentStatus;
    buffer: any | null; // Platform-specific buffer (ArrayBuffer, Buffer, etc.)
    rawText: string;
    tempPath?: string | null;
    error?: string | null;
}

export interface TranscriptionSession {
    sessionId: string;
    settings: any;
    segments: Map<number, TranscriptionSegment>;
    nextSequenceToCommit: number;
    stopRequested: boolean;
    finalized: boolean;
    flushing: boolean;
    failureError: string | null;
    pendingRetrySaved: boolean;
    committedRawParts: string[];
    finalRawText: string;
    finalRefinementRequested: boolean;
    finalRefinementPending: boolean;
    createdAt: number;
}
