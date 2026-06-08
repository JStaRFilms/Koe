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

    // Settings
    getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.SAVE_SETTINGS, settings),
    testGroqKey: (apiKey) => ipcRenderer.invoke(CHANNELS.TEST_GROQ_KEY, apiKey),
    getAccountState: () => ipcRenderer.invoke(CHANNELS.GET_ACCOUNT_STATE),
    signUp: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_SIGN_UP, payload),
    signIn: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_SIGN_IN, payload),
    signOut: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_SIGN_OUT),
    requestAccountPasswordReset: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_REQUEST_PASSWORD_RESET, payload),
    requestAccountEmailVerification: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_REQUEST_EMAIL_VERIFICATION),
    saveAccountByok: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_SAVE_BYOK, payload),
    deleteAccountByok: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_DELETE_BYOK),
    setAccountMode: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_SET_MODE, payload),
    saveAccountSettings: (payload) => ipcRenderer.invoke(CHANNELS.ACCOUNT_SAVE_SYNCED_SETTINGS, payload),
    openWebBilling: () => ipcRenderer.invoke(CHANNELS.ACCOUNT_OPEN_WEB_BILLING),

    // Usage Stats
    getUsageStats: () => ipcRenderer.invoke(CHANNELS.GET_USAGE_STATS),

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message),

    // History
    getHistory: () => ipcRenderer.invoke(CHANNELS.GET_HISTORY),
    clearHistory: () => ipcRenderer.invoke(CHANNELS.CLEAR_HISTORY),
    retryHistoryEntry: (entryId) => ipcRenderer.invoke(CHANNELS.RETRY_HISTORY_ENTRY, entryId),
    retryLastTranscript: () => ipcRenderer.invoke(CHANNELS.RETRY_LAST_TRANSCRIPT),
    exportHistory: (format) => ipcRenderer.invoke('history:export', format),

    // Logs
    openLogsFolder: () => ipcRenderer.invoke('app:open-logs'),

    // Audio
    sendAudioSegment: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SEGMENT, payload),
    sendAudioChunk: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SEGMENT, payload),
    notifyAudioSessionStopped: (payload) => ipcRenderer.send(CHANNELS.AUDIO_SESSION_STOPPED, payload),
    processAudioUpload: (payload) => ipcRenderer.invoke(CHANNELS.PROCESS_AUDIO_UPLOAD, payload),

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
    },
    onOpenImportTab: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.OPEN_IMPORT_TAB);
        ipcRenderer.on(CHANNELS.OPEN_IMPORT_TAB, () => callback());
    }
});
