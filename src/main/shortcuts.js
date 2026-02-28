const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { setRecordingState } = require('./tray');

// Keeps track of the recording state for the hotkey
let isRecording = false;

function registerShortcuts(mainWindow) {
    // Read hotkey from settings if available, else default
    const hotkey = DEFAULT_SETTINGS.hotkey; // later read from electron-store

    globalShortcut.register(hotkey, () => {
        isRecording = !isRecording;
        console.log(`Global hotkey triggered. Recording state: ${isRecording}`);

        // Update tray UI
        setRecordingState(isRecording, mainWindow);

        // Notify renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, isRecording);
        }
    });

    if (!globalShortcut.isRegistered(hotkey)) {
        console.error(`Global shortcut ${hotkey} failed to register.`);
    }
}

function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}

module.exports = {
    registerShortcuts,
    unregisterShortcuts
};
