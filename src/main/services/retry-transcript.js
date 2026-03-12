const { getSettings } = require('./settings');
const { enhance } = require('./groq');
const { processAudio } = require('./groq');
const { autoPaste } = require('./clipboard');
const historyService = require('./history');
const pendingRetryService = require('./pending-retry');
const logger = require('./logger');

function emitRetryStatus(options, status) {
    if (typeof options?.onStatus === 'function') {
        options.onStatus(status);
    }
}

async function retryPendingAudio(options = {}) {
    const pendingRetry = pendingRetryService.getPendingRetry();
    if (!pendingRetry) {
        return null;
    }

    const settings = getSettings();
    const retryOptions = {
        language: pendingRetry.options?.language || settings.language || 'auto',
        enhanceText: pendingRetry.options?.enhanceText ?? (settings.enhanceText !== false),
        promptStyle: pendingRetry.options?.promptStyle || settings.promptStyle || 'Clean',
        customPrompt: pendingRetry.options?.customPrompt ?? (settings.customPrompt || ''),
        model: pendingRetry.options?.model || settings.model || 'whisper-large-v3-turbo'
    };

    logger.info(
        `[Retry] Retrying pending audio for session ${pendingRetry.sessionId ?? 'unknown'} ` +
        `(captured ${pendingRetry.audioSeconds?.toFixed?.(1) || '0.0'}s).`
    );

    emitRetryStatus(options, {
        stage: 'retrying',
        label: 'Retrying failed audio',
        detail: 'Using the last unsent recording',
        progress: 8,
        source: 'pending-audio'
    });

    const result = await processAudio(pendingRetry.buffer, pendingRetry.audioSeconds, {
        ...retryOptions,
        onStage: (status) => {
            emitRetryStatus(options, {
                ...status,
                detail: 'Using the last unsent recording',
                source: 'pending-audio'
            });
        }
    });
    const rawText = String(result?.rawText || '').trim();

    if (!rawText) {
        pendingRetryService.clearPendingRetry();
        return {
            rawText: '',
            refinedText: '',
            entry: null,
            source: 'pending-audio',
            empty: true
        };
    }

    const refinedText = String(result?.refinedText || rawText).trim() || rawText;
    const savedEntries = historyService.addHistoryEntry({
        rawText,
        refinedText,
        language: retryOptions.language,
        isLlamaEnhanced: retryOptions.enhanceText && refinedText !== rawText,
        source: 'retry'
    });

    pendingRetryService.clearPendingRetry();

    return {
        rawText,
        refinedText,
        entry: savedEntries[0],
        source: 'pending-audio'
    };
}

async function retryTranscript(entryId = null, options = {}) {
    if (!entryId) {
        const pendingRetryResult = await retryPendingAudio(options);
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

    let refinedText = (entry.refinedText || rawText).trim();
    if (settings.groqApiKey) {
        emitRetryStatus(options, {
            stage: 'refining',
            label: entryId ? 'Retrying saved transcript' : 'Retrying latest transcript',
            detail: entryId ? 'Using the selected transcript from history' : 'Using the latest transcript from history',
            progress: 72,
            source: 'history'
        });
        refinedText = await enhance(rawText, settings.promptStyle || 'Clean');
    }

    const savedEntries = historyService.addHistoryEntry({
        rawText,
        refinedText,
        language: entry.language || settings.language || 'auto',
        isLlamaEnhanced: Boolean(settings.groqApiKey) || refinedText !== rawText,
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

    if (!result?.refinedText) {
        return result;
    }

    if (typeof options.beforePaste === 'function') {
        await options.beforePaste(result);
    }

    autoPaste(result.refinedText);
    return result;
}

module.exports = {
    retryTranscript,
    retryAndPasteTranscript
};
