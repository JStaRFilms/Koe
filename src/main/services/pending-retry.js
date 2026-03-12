const fs = require('fs');
const path = require('path');
const { app } = require('electron');
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

function getRetryDirectory() {
    const retryDir = path.join(app.getPath('userData'), 'pending-retry');
    if (!fs.existsSync(retryDir)) {
        fs.mkdirSync(retryDir, { recursive: true });
    }

    return retryDir;
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

function persistSegmentAudio(sessionId, sequence, input) {
    const buffer = toBuffer(input);
    if (!buffer || buffer.length === 0) {
        return null;
    }

    const filePath = path.join(
        getRetryDirectory(),
        `session-${sessionId}-segment-${sequence}-${Date.now()}.wav`
    );

    fs.writeFileSync(filePath, buffer);
    return filePath;
}

function readTempAudio(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return null;
    }

    return fs.readFileSync(filePath);
}

function removeTempFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return;
    }

    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        // Ignore best-effort cleanup failures.
    }
}

function savePendingRetryManifest(manifest = {}) {
    getStore().set('pending', manifest);
    return manifest;
}

function getPendingRetry() {
    return getStore().get('pending') || null;
}

function cleanupManifestFiles(manifest) {
    for (const segment of manifest?.unresolvedSegments || []) {
        removeTempFile(segment.tempPath);
    }
}

function clearPendingRetry() {
    const manifest = getPendingRetry();
    if (manifest) {
        cleanupManifestFiles(manifest);
    }

    getStore().delete('pending');
}

function markPendingRetryError(errorMessage) {
    const manifest = getPendingRetry();
    if (!manifest) {
        return null;
    }

    const updatedManifest = {
        ...manifest,
        lastError: String(errorMessage || '').trim() || 'Processing failed.',
        lastFailedAt: Date.now()
    };

    savePendingRetryManifest(updatedManifest);
    return updatedManifest;
}

module.exports = {
    persistSegmentAudio,
    readTempAudio,
    removeTempFile,
    savePendingRetryManifest,
    getPendingRetry,
    clearPendingRetry,
    markPendingRetryError
};
