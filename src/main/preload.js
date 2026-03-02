const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('../shared/constants');

// Default expose empty functions if API fails
let apiGetUsageStats = () => { };
try {
    apiGetUsageStats = () => ipcRenderer.invoke(CHANNELS.GET_USAGE_STATS);
} catch (e) { }

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    // Receive hotkey/tray toggle events
    onRecordingToggle: (callback) => {
        // Remove all previous listeners to avoid duplicates on reload
        ipcRenderer.removeAllListeners(CHANNELS.RECORDING_TOGGLED);
        ipcRenderer.on(CHANNELS.RECORDING_TOGGLED, (event, isRecording) => callback(isRecording));
    },

    // Settings
    getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.SAVE_SETTINGS, settings),
    testGroqKey: (apiKey) => ipcRenderer.invoke(CHANNELS.TEST_GROQ_KEY, apiKey),

    // Usage Stats
    getUsageStats: apiGetUsageStats,

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message),

    // History
    getHistory: () => ipcRenderer.invoke(CHANNELS.GET_HISTORY),
    clearHistory: () => ipcRenderer.invoke(CHANNELS.CLEAR_HISTORY),

    // Audio
    sendAudioChunk: (arrayBuffer) => ipcRenderer.send(CHANNELS.AUDIO_CHUNK, arrayBuffer),

    // Window Controls
    minimizeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_MINIMIZE),
    closeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_CLOSE),

    // Transcription Events
    onTranscriptionStatus: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_STATUS);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_STATUS, (event, status) => callback(status));
    },
    onTranscriptionResult: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_RESULT);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_RESULT, (event, text) => callback({ text }));
    }
});
