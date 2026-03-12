const Store = require('electron-store').default || require('electron-store');

let pendingRetryStore = null;

function getStore() {
    if (!pendingRetryStore) {
        pendingRetryStore = new Store({
            name: 'pending-retry'
        });
    }

    return pendingRetryStore;
}

function toBuffer(input) {
    if (!input) {
        return null;
    }

    if (Buffer.isBuffer(input)) {
        return input;
    }

    if (input instanceof ArrayBuffer) {
        return Buffer.from(input);
    }

    if (ArrayBuffer.isView(input)) {
        return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    }

    if (typeof input === 'object' && input.type === 'Buffer' && Array.isArray(input.data)) {
        return Buffer.from(input.data);
    }

    return Buffer.from(input);
}

function savePendingRetry(audioData = {}, metadata = {}) {
    const buffer = toBuffer(audioData.buffer);
    if (!buffer || buffer.length === 0) {
        return null;
    }

    const payload = {
        sessionId: audioData.sessionId ?? null,
        audioSeconds: Number(audioData.audioSeconds || 0),
        capturedAt: Date.now(),
        bufferBase64: buffer.toString('base64'),
        options: {
            language: metadata.language || 'auto',
            enhanceText: metadata.enhanceText !== false,
            promptStyle: metadata.promptStyle || 'Clean',
            customPrompt: metadata.customPrompt || '',
            model: metadata.model || 'whisper-large-v3-turbo'
        },
        lastError: metadata.lastError || null,
        lastFailedAt: metadata.lastFailedAt || null
    };

    getStore().set('pending', payload);
    return payload;
}

function getPendingRetry() {
    const payload = getStore().get('pending');
    if (!payload?.bufferBase64) {
        return null;
    }

    return {
        ...payload,
        buffer: Buffer.from(payload.bufferBase64, 'base64')
    };
}

function clearPendingRetry() {
    getStore().delete('pending');
}

function markPendingRetryError(errorMessage) {
    const payload = getStore().get('pending');
    if (!payload) {
        return null;
    }

    const updatedPayload = {
        ...payload,
        lastError: String(errorMessage || '').trim() || 'Processing failed.',
        lastFailedAt: Date.now()
    };

    getStore().set('pending', updatedPayload);
    return updatedPayload;
}

module.exports = {
    savePendingRetry,
    getPendingRetry,
    clearPendingRetry,
    markPendingRetryError
};
