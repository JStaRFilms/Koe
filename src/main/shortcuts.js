const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { getSetting } = require('./services/settings');
const { setRecordingState } = require('./tray');
const { toggleRecording } = require('./services/recording-state');
const { retryAndPasteTranscript } = require('./services/retry-transcript');
const pendingRetryService = require('./services/pending-retry');
const { closeSettingsWindow } = require('./settings-window');

const RETRY_LAST_HOTKEY = 'CommandOrControl+Shift+,';

let currentHotkey = null;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendRetryStatus(mainWindow, status) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, {
        ...status,
        sessionId: status.sessionId,
        forceDisplay: true
    });
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

async function handleRetryLastTranscript(mainWindow) {
    const retrySessionId = Date.now();
    closeSettingsWindow();
    await wait(200);

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.showInactive();
    }

    try {
        const result = await retryAndPasteTranscript(null, {
            onStatus: (status) => {
                sendRetryStatus(mainWindow, {
                    ...status,
                    sessionId: retrySessionId
                });
            }
        });

        if (mainWindow && !mainWindow.isDestroyed()) {
            if (result?.refinedText) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, {
                    text: result.refinedText,
                    sessionId: retrySessionId,
                    forceDisplay: true
                });
            } else if (result?.empty) {
                sendRetryStatus(mainWindow, {
                    stage: 'empty',
                    label: 'No speech detected',
                    detail: 'The saved recording did not produce any transcript.',
                    sessionId: retrySessionId
                });
            }
        }
    } catch (error) {
        const retryAvailable = Boolean(pendingRetryService.getPendingRetry());
        const detail = retryAvailable
            ? 'Retry could not be completed.'
            : 'No retryable audio or transcript is available.';
        sendRetryStatus(mainWindow, {
            stage: 'error',
            error: error.message,
            detail,
            retryAvailable,
            sessionId: retrySessionId,
            lingerMs: retryAvailable ? 6500 : 4500
        });
        throw error;
    }
}

function registerRetryShortcut(mainWindow) {
    const registered = globalShortcut.register(RETRY_LAST_HOTKEY, () => {
        handleRetryLastTranscript(mainWindow).catch((error) => {
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

    registerRetryShortcut(mainWindow);

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
        registerRetryShortcut(mainWindow);
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
