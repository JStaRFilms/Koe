const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { getSetting } = require('./services/settings');
const { setRecordingState } = require('./tray');

let isRecording = false;
let currentHotkey = null;

function registerShortcuts(mainWindow) {
    // Get hotkey from settings, fallback to default
    const hotkey = getSetting('hotkey') || DEFAULT_SETTINGS.hotkey;
    currentHotkey = hotkey;

    const registered = globalShortcut.register(hotkey, () => {
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

    if (!registered) {
        console.error(`Global shortcut ${hotkey} failed to register.`);
        return false;
    }

    console.log(`Global shortcut ${hotkey} registered successfully.`);
    return true;
}

function unregisterShortcuts() {
    globalShortcut.unregisterAll();
    currentHotkey = null;
}

function updateHotkey(mainWindow, newHotkey) {
    // Unregister current hotkey
    unregisterShortcuts();

    // Register new hotkey
    const registered = globalShortcut.register(newHotkey, () => {
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

    if (registered) {
        currentHotkey = newHotkey;
        console.log(`Global shortcut updated to ${newHotkey}.`);
        return true;
    } else {
        console.error(`Failed to register new hotkey ${newHotkey}.`);
        // Try to re-register the old hotkey as fallback
        registerShortcuts(mainWindow);
        return false;
    }
}

function getCurrentHotkey() {
    return currentHotkey;
}

module.exports = {
    registerShortcuts,
    unregisterShortcuts,
    updateHotkey,
    getCurrentHotkey
};
