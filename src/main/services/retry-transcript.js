const { getSettings } = require('./settings');
const { enhance } = require('./groq');
const { autoPaste } = require('./clipboard');
const historyService = require('./history');
const logger = require('./logger');

async function retryTranscript(entryId = null) {
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

    let refinedText = rawText;
    if (settings.groqApiKey) {
        refinedText = await enhance(rawText, settings.promptStyle || 'Clean');
    }

    const savedEntries = historyService.addHistoryEntry({
        rawText,
        refinedText,
        language: entry.language || settings.language || 'auto',
        isLlamaEnhanced: Boolean(settings.groqApiKey),
        source: 'retry'
    });

    return {
        rawText,
        refinedText,
        entry: savedEntries[0]
    };
}

async function retryAndPasteTranscript(entryId = null, options = {}) {
    const result = await retryTranscript(entryId);

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
