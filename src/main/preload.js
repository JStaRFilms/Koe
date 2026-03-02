const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('../shared/constants');

contextBridge.exposeInMainWorld('api', {
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

    // Usage Stats
    getUsageStats: () => ipcRenderer.invoke(CHANNELS.GET_USAGE_STATS),

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message),

    // History
    getHistory: () => ipcRenderer.invoke(CHANNELS.GET_HISTORY),
    clearHistory: () => ipcRenderer.invoke(CHANNELS.CLEAR_HISTORY),

    // Audio
    sendAudioChunk: (arrayBuffer) => ipcRenderer.send(CHANNELS.AUDIO_CHUNK, arrayBuffer),

    // Window Controls
    hideWindow: () => ipcRenderer.send(CHANNELS.WINDOW_HIDE),
    closeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_CLOSE),

    // Transcription Events
    onTranscriptionStatus: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_STATUS);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_STATUS, (event, status) => callback(status));
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
    }
});
