const { getSettings } = require('./settings');
const { enhance } = require('./groq');
const { autoPaste } = require('./clipboard');
const historyService = require('./history');
const sessionManager = require('./transcription-session-manager');
const pendingRetryService = require('./pending-retry');
const logger = require('./logger');

function emitRetryStatus(options, status) {
    if (typeof options?.onStatus === 'function') {
        options.onStatus(status);
    }
}

async function retryPendingSession(options = {}) {
    try {
        return await sessionManager.retryPendingSession(options);
    } catch (error) {
        const message = String(error?.message || '');
        if (message.includes('Retry audio for segment')) {
            logger.warn(`[Retry] Clearing stale pending retry: ${message}`);
            pendingRetryService.clearPendingRetry();
            return null;
        }

        throw error;
    }
}

async function retryTranscript(entryId = null, options = {}) {
    if (!entryId) {
        const pendingRetryResult = await retryPendingSession(options);
        if (pendingRetryResult) {
            return pendingRetryResult;
        }
    }

    const settings = getSettings();
    const entry = entryId
        ? historyService.getHistoryEntryById(entryId)
        : historyService.getLatestEntry();

    if (!entry) {
        throw new Error('No transcript available to retry.');
    }

    const rawText = historyService.getEntryRawText(entry).trim();
    if (!rawText) {
        throw new Error('No raw transcript available to retry.');
    }

    logger.info(`[Retry] Retrying transcript from history entry ${entry.id}.`);
    emitRetryStatus(options, {
        stage: 'retrying',
        label: entryId ? 'Retrying saved transcript' : 'Retrying latest transcript',
        detail: entryId ? 'Using the selected transcript from history' : 'Using the latest transcript from history',
        progress: 32,
        source: 'history'
    });

    emitRetryStatus(options, {
        stage: 'refining',
        label: entryId ? 'Retrying saved transcript' : 'Retrying latest transcript',
        detail: entryId ? 'Using the selected transcript from history' : 'Using the latest transcript from history',
        progress: 72,
        source: 'history'
    });

    const refinedText = await enhance(rawText, settings.promptStyle || 'Clean', settings.customPrompt || '');
    const savedEntries = historyService.addHistoryEntry({
        rawText,
        refinedText,
        language: entry.language || settings.language || 'auto',
        isLlamaEnhanced: true,
        source: 'retry'
    });

    return {
        rawText,
        refinedText,
        entry: savedEntries[0],
        source: 'history'
    };
}

async function retryAndPasteTranscript(entryId = null, options = {}) {
    const result = await retryTranscript(entryId, options);

    if (!result?.refinedText || result.source === 'pending-session') {
        return result;
    }

    if (typeof options.beforePaste === 'function') {
        await options.beforePaste(result);
    }

    await autoPaste(result.refinedText);
    return result;
}

module.exports = {
    retryTranscript,
    retryAndPasteTranscript
};
