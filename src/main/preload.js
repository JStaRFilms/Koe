const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('../shared/constants');

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

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message)
});
