const Store = require('electron-store').default || require('electron-store');
const { v4: uuidv4 } = require('uuid');

let historyStore = null;

function getStore() {
    if (!historyStore) {
        historyStore = new Store({
            name: 'transcription-history'
        });
    }
    return historyStore;
}

const MAX_HISTORY_ENTRIES = 100;

function normalizeHistoryEntry(input, language = 'auto', isLlamaEnhanced = false) {
    if (typeof input === 'object' && input !== null) {
        const rawText = (input.rawText || input.text || '').trim();
        const refinedText = (input.refinedText || input.text || rawText).trim();

        return {
            id: input.id || uuidv4(),
            timestamp: input.timestamp || Date.now(),
            rawText,
            refinedText,
            text: refinedText || rawText,
            language: input.language || language,
            isLlamaEnhanced: input.isLlamaEnhanced ?? isLlamaEnhanced,
            source: input.source || 'transcription'
        };
    }

    const normalizedText = String(input || '').trim();

    return {
        id: uuidv4(),
        timestamp: Date.now(),
        rawText: normalizedText,
        refinedText: normalizedText,
        text: normalizedText,
        language,
        isLlamaEnhanced,
        source: 'transcription'
    };
}

function getHistory() {
    return getStore().get('entries', []);
}

function addHistoryEntry(input, language = 'auto', isLlamaEnhanced = false) {
    const entries = getHistory();
    const newEntry = normalizeHistoryEntry(input, language, isLlamaEnhanced);

    entries.unshift(newEntry);

    if (entries.length > MAX_HISTORY_ENTRIES) {
        entries.length = MAX_HISTORY_ENTRIES;
    }

    getStore().set('entries', entries);
    return entries;
}

function getHistoryEntryById(entryId) {
    return getHistory().find((entry) => entry.id === entryId) || null;
}

function getLatestEntry() {
    return getHistory()[0] || null;
}

function getEntryRawText(entry) {
    return entry?.rawText || entry?.text || '';
}

function searchHistory(query) {
    const entries = getHistory();
    if (!query) return entries;

    const lowerQuery = query.toLowerCase();
    return entries.filter(entry =>
        (entry.refinedText || '').toLowerCase().includes(lowerQuery) ||
        (entry.rawText || '').toLowerCase().includes(lowerQuery)
    );
}

function clearHistory() {
    getStore().set('entries', []);
    return [];
}

module.exports = {
    getHistory,
    addHistoryEntry,
    getHistoryEntryById,
    getLatestEntry,
    getEntryRawText,
    searchHistory,
    clearHistory
};
