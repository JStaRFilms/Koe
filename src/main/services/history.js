const Store = require('electron-store').default || require('electron-store');
const { v4: uuidv4 } = require('uuid');

const historyStore = new Store({
    name: 'transcription-history'
});

const MAX_HISTORY_ENTRIES = 100;

function getHistory() {
    return historyStore.get('entries', []);
}

function addHistoryEntry(text, language = 'auto', isLlamaEnhanced = false) {
    const entries = getHistory();
    const newEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        text: text,
        language: language,
        isLlamaEnhanced,
    };

    entries.unshift(newEntry); // Newest first

    if (entries.length > MAX_HISTORY_ENTRIES) {
        entries.length = MAX_HISTORY_ENTRIES; // Trim the end
    }

    historyStore.set('entries', entries);
    return entries;
}

function clearHistory() {
    historyStore.set('entries', []);
    return [];
}

module.exports = {
    getHistory,
    addHistoryEntry,
    clearHistory
};
