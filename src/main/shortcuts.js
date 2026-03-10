const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { getSetting } = require('./services/settings');
const { setRecordingState } = require('./tray');
const { toggleRecording } = require('./services/recording-state');
const { retryAndPasteTranscript } = require('./services/retry-transcript');
const { closeSettingsWindow } = require('./settings-window');

const RETRY_LAST_HOTKEY = 'CommandOrControl+Shift+,';

let currentHotkey = null;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function handleRetryLastTranscript() {
    closeSettingsWindow();
    await wait(200);
    await retryAndPasteTranscript(null);
}

function registerRetryShortcut() {
    const registered = globalShortcut.register(RETRY_LAST_HOTKEY, () => {
        handleRetryLastTranscript().catch((error) => {
            console.error(`[Retry] Failed to retry last transcript: ${error.message}`);
        });
    });

    if (!registered) {
        console.warn(`Retry shortcut ${RETRY_LAST_HOTKEY} failed to register.`);
    } else {
        console.log(`Retry shortcut ${RETRY_LAST_HOTKEY} registered successfully.`);
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

    registerRetryShortcut();

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
        registerRetryShortcut();
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
