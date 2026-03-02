const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { setRecordingState } = require('./tray');

let isRecording = false;

function registerShortcuts(mainWindow) {
    const hotkey = DEFAULT_SETTINGS.hotkey;

    globalShortcut.register(hotkey, () => {
        isRecording = !isRecording;
        console.log(`Global hotkey triggered. Recording state: ${isRecording}`);

        // Update tray UI
        setRecordingState(isRecording, mainWindow);

        if (mainWindow && !mainWindow.isDestroyed()) {
            if (isRecording) {
                // Starting recording → show pill WITHOUT stealing focus
                mainWindow.showInactive();
            }
            // Always notify renderer of the toggle
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
