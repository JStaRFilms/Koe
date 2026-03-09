const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { getSetting } = require('./services/settings');
const { setRecordingState } = require('./tray');
const { toggleRecording } = require('./services/recording-state');

let currentHotkey = null;

function handleRecordingToggle(mainWindow) {
    const recordingState = toggleRecording();
    console.log(`Global hotkey triggered. Recording state: ${recordingState.isRecording} (session ${recordingState.sessionId})`);

    setRecordingState(recordingState.isRecording, mainWindow);

    if (mainWindow && !mainWindow.isDestroyed()) {
        if (recordingState.isRecording) {
            mainWindow.showInactive();
        }
        mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, recordingState);
    }
}

function registerShortcuts(mainWindow) {
    const hotkey = getSetting('hotkey') || DEFAULT_SETTINGS.hotkey;
    currentHotkey = hotkey;

    const registered = globalShortcut.register(hotkey, () => {
        handleRecordingToggle(mainWindow);
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
    unregisterShortcuts();

    const registered = globalShortcut.register(newHotkey, () => {
        handleRecordingToggle(mainWindow);
    });

    if (registered) {
        currentHotkey = newHotkey;
        console.log(`Global shortcut updated to ${newHotkey}.`);
        return true;
    }

    console.error(`Failed to register new hotkey ${newHotkey}.`);
    registerShortcuts(mainWindow);
    return false;
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
