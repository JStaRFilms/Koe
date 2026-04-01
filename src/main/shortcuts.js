const { globalShortcut } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');
const { getSetting } = require('./services/settings');
const { setRecordingState } = require('./tray');
const { toggleRecording } = require('./services/recording-state');
const { retryAndPasteTranscript } = require('./services/retry-transcript');
const historyService = require('./services/history');
const pendingRetryService = require('./services/pending-retry');
const { showPillWindow } = require('./services/pill-window');
const { closeSettingsWindow } = require('./settings-window');
const logger = require('./services/logger');

const RETRY_LAST_HOTKEY = 'CommandOrControl+Shift+,';

let currentHotkey = null;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendRetryStatus(mainWindow, status, fallbackSessionId = null) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, {
        ...status,
        sessionId: status.sessionId ?? fallbackSessionId,
        forceDisplay: true
    });
}

function handleRecordingToggle(mainWindow, options = {}) {
    const recordingState = toggleRecording();
    logger.info(`Recording toggle triggered. Recording state: ${recordingState.isRecording} (session ${recordingState.sessionId})`);

    setRecordingState(recordingState.isRecording, mainWindow);

    if (mainWindow && !mainWindow.isDestroyed()) {
        if (recordingState.isRecording) {
            showPillWindow(mainWindow);
        }
        mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, {
            ...recordingState,
            overrides: options
        });
    }
}

async function handleRetryLastTranscript(mainWindow) {
    const retrySessionId = Date.now();
    closeSettingsWindow();
    await wait(200);

    if (mainWindow && !mainWindow.isDestroyed()) {
        showPillWindow(mainWindow);
    }

    try {
        const result = await retryAndPasteTranscript(null, {
            onStatus: (status) => {
                sendRetryStatus(mainWindow, status, retrySessionId);
            }
        });

        if (mainWindow && !mainWindow.isDestroyed()) {
            if (result?.source === 'pending-session' && result.sessionId) {
                sendRetryStatus(mainWindow, {
                    stage: 'retrying',
                    label: 'Retrying',
                    progress: 18,
                    sessionId: result.sessionId
                });
                return;
            }

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
        const retryAvailable = Boolean(
            pendingRetryService.getPendingRetry() ||
            historyService.getEntryRawText(historyService.getLatestEntry())
        );
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
            logger.error(`[Retry] Failed to retry last transcript: ${error.message}`);
        });
    });

    if (!registered) {
        logger.warn(`Retry shortcut ${RETRY_LAST_HOTKEY} failed to register.`);
    } else {
        logger.info(`Retry shortcut ${RETRY_LAST_HOTKEY} registered successfully.`);
    }
}

function registerShortcuts(mainWindow) {
    const hotkey = getSetting('hotkey') || DEFAULT_SETTINGS.hotkey;
    currentHotkey = hotkey;

    const registered = globalShortcut.register(hotkey, () => {
        handleRecordingToggle(mainWindow);
    });

    if (!registered) {
        logger.error(`Global shortcut ${hotkey} failed to register.`);
        return false;
    }

    registerRetryShortcut(mainWindow);

    logger.info(`Global shortcut ${hotkey} registered successfully.`);
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
        logger.info(`Global shortcut updated to ${newHotkey}.`);
        return true;
    }

    logger.error(`Failed to register new hotkey ${newHotkey}.`);
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
    getCurrentHotkey,
    handleRecordingToggle
};
