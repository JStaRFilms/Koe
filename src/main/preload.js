const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('../shared/constants');

contextBridge.exposeInMainWorld('api', {
    // App info
    isPackaged: () => ipcRenderer.invoke('app:is-packaged'),
    getResourcesPath: () => ipcRenderer.invoke('app:resources-path'),
    // Recording toggle events from main process
    onRecordingToggle: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.RECORDING_TOGGLED);
        ipcRenderer.on(CHANNELS.RECORDING_TOGGLED, (event, isRecording) => callback(isRecording));
    },

    // Window animate-in event
    onAnimateIn: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.WINDOW_ANIMATE_IN);
        ipcRenderer.on(CHANNELS.WINDOW_ANIMATE_IN, () => callback());
    },

    onMeetingDetected: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.MEETING_DETECTED);
        ipcRenderer.on(CHANNELS.MEETING_DETECTED, () => callback());
    },

    onAiInsight: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.AI_INSIGHT);
        ipcRenderer.on(CHANNELS.AI_INSIGHT, (event, insight) => callback(insight));
    },

    // Settings
    getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.SAVE_SETTINGS, settings),
    testGroqKey: (apiKey) => ipcRenderer.invoke(CHANNELS.TEST_GROQ_KEY, apiKey),

    // Usage Stats
    getUsageStats: () => ipcRenderer.invoke(CHANNELS.GET_USAGE_STATS),

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message),

    // History
    getHistory: () => ipcRenderer.invoke(CHANNELS.GET_HISTORY),
    searchHistory: (query) => ipcRenderer.invoke(CHANNELS.SEARCH_HISTORY, query),
    clearHistory: () => ipcRenderer.invoke(CHANNELS.CLEAR_HISTORY),
    retryHistoryEntry: (entryId) => ipcRenderer.invoke(CHANNELS.RETRY_HISTORY_ENTRY, entryId),
    retryLastTranscript: () => ipcRenderer.invoke(CHANNELS.RETRY_LAST_TRANSCRIPT),
    exportHistory: (format) => ipcRenderer.invoke('history:export', format),
    getTasks: () => ipcRenderer.invoke(CHANNELS.GET_TASKS),
    toggleTask: (taskId) => ipcRenderer.invoke(CHANNELS.TOGGLE_TASK, taskId),

    // Logs
    openLogsFolder: () => ipcRenderer.invoke('app:open-logs'),

    // Audio
    toggleRecording: (options = {}) => ipcRenderer.send(CHANNELS.TOGGLE_RECORDING, options),
    sendAudioSegment: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SEGMENT, payload),
    sendAudioChunk: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SEGMENT, payload),
    notifyAudioSessionStopped: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SESSION_STOPPED, payload),

    // Window Controls
    hideWindow: () => ipcRenderer.send(CHANNELS.WINDOW_HIDE),
    closeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_CLOSE),

    // Transcription Events
    onTranscriptionStatus: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_STATUS);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_STATUS, (event, status) => callback(status));
    },
    onTranscriptionPreview: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_PREVIEW);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_PREVIEW, (event, payload) => callback(payload));
    },
    onTranscriptionResult: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_RESULT);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_RESULT, (event, text) => callback({ text }));
    },
    onTranscriptionComplete: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_COMPLETE);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_COMPLETE, (event, text) => callback(text));
    },

    // Usage stats stream
    onUsageStats: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.USAGE_STATS);
        ipcRenderer.on(CHANNELS.USAGE_STATS, (event, stats) => callback(stats));
    },

    // Settings Window APIs
    closeSettingsWindow: () => ipcRenderer.send(CHANNELS.CLOSE_SETTINGS_WINDOW),

    // Tab switch events from main process
    onOpenSettingsTab: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.OPEN_SETTINGS_TAB);
        ipcRenderer.on(CHANNELS.OPEN_SETTINGS_TAB, () => callback());
    },
    onOpenHistoryTab: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.OPEN_HISTORY_TAB);
        ipcRenderer.on(CHANNELS.OPEN_HISTORY_TAB, () => callback());
    },
    onOpenUsageTab: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.OPEN_USAGE_TAB);
        ipcRenderer.on(CHANNELS.OPEN_USAGE_TAB, () => callback());
    }
});
