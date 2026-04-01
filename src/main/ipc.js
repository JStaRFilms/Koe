const { ipcMain, dialog, shell, app } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const historyService = require('./services/history');
const { retryAndPasteTranscript } = require('./services/retry-transcript');
const pendingRetryService = require('./services/pending-retry');
const sessionManager = require('./services/transcription-session-manager');
const { closeSettingsWindow } = require('./settings-window');
const { updateHotkey, handleRecordingToggle } = require('./shortcuts');
const { applyLaunchOnStartupPreference } = require('./services/startup');
const { applyAutoUpdatePreference } = require('./services/updater');
const logger = require('./services/logger');
const fs = require('fs');

let mainWindowRef = null;

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hideSettingsBeforePaste() {
    closeSettingsWindow();
    await wait(200);
}

function sendRetryStatus(status) {
    if (!mainWindowRef || mainWindowRef.isDestroyed()) {
        return;
    }

    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, {
        ...status,
        forceDisplay: true
    });
}

function setupIpcHandlers(mainWindow) {
    mainWindowRef = mainWindow;
    sessionManager.init(mainWindow);

    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => getSettings());

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        const oldSettings = getSettings();
        setSettings(newSettings);

        if (newSettings.hotkey && newSettings.hotkey !== oldSettings.hotkey) {
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                const success = updateHotkey(mainWindowRef, newSettings.hotkey);
                if (!success) {
                    setSettings({ ...newSettings, hotkey: oldSettings.hotkey });
                    throw new Error(`Failed to register hotkey "${newSettings.hotkey}". It may be invalid or already in use.`);
                }
            }
        }

        if (newSettings.launchOnStartup !== oldSettings.launchOnStartup) {
            const applied = applyLaunchOnStartupPreference(newSettings.launchOnStartup !== false);
            if (!applied) {
                setSettings({ ...newSettings, launchOnStartup: oldSettings.launchOnStartup });
                throw new Error('Failed to update launch-on-startup preference.');
            }
        }

        if (newSettings.autoUpdate !== oldSettings.autoUpdate) {
            applyAutoUpdatePreference(newSettings.autoUpdate !== false);
        }

        return true;
    });

    ipcMain.handle(CHANNELS.TEST_GROQ_KEY, async (event, apiKey) => validateApiKey(apiKey));
    ipcMain.handle(CHANNELS.GET_USAGE_STATS, async () => rateLimiter.getUsageStats());
    ipcMain.handle(CHANNELS.GET_HISTORY, async () => historyService.getHistory());
    ipcMain.handle(CHANNELS.SEARCH_HISTORY, async (event, query) => historyService.searchHistory(query));
    ipcMain.handle(CHANNELS.CLEAR_HISTORY, async () => historyService.clearHistory());

    ipcMain.handle(CHANNELS.GET_TASKS, async () => {
        const historyStore = new Store({ name: 'tasks-history' });
        return historyStore.get('tasks', []);
    });

    ipcMain.handle(CHANNELS.TOGGLE_TASK, async (event, taskId) => {
        const historyStore = new Store({ name: 'tasks-history' });
        const tasks = historyStore.get('tasks', []);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            historyStore.set('tasks', tasks);
        }
        return tasks;
    });

    ipcMain.handle(CHANNELS.RETRY_HISTORY_ENTRY, async (event, entryId) => {
        return retryAndPasteTranscript(entryId, {
            beforePaste: hideSettingsBeforePaste
        });
    });

    ipcMain.handle(CHANNELS.RETRY_LAST_TRANSCRIPT, async () => {
        return retryAndPasteTranscript(null, {
            onStatus: (status) => sendRetryStatus(status)
        });
    });

    ipcMain.on(CHANNELS.LOG, (event, message) => {
        logger.debug('[Renderer]', message);
    });

    ipcMain.on(CHANNELS.WINDOW_MINIMIZE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.minimize();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_CLOSE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.hide();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_HIDE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.hide();
        }
    });

    ipcMain.on(CHANNELS.CLOSE_SETTINGS_WINDOW, () => {
        closeSettingsWindow();
    });

    ipcMain.on(CHANNELS.TOGGLE_RECORDING, (event, options) => {
        handleRecordingToggle(mainWindow, options);
    });


    ipcMain.on(CHANNELS.AUDIO_SEGMENT, (event, audioData) => {
        sessionManager.handleSegment(audioData).catch((error) => {
            logger.error('[Pipeline] Failed to enqueue audio segment:', error);
            sendRetryStatus({
                sessionId: audioData?.sessionId,
                stage: 'error',
                error: error.message,
                retryAvailable: Boolean(pendingRetryService.getPendingRetry()),
                lingerMs: 6500
            });
        });
    });

    ipcMain.on(CHANNELS.AUDIO_SESSION_STOPPED, (event, payload) => {
        const sessionId = typeof payload === 'object' ? payload?.sessionId : payload;
        sessionManager.handleSessionStopped(sessionId).catch((error) => {
            logger.error('[Pipeline] Failed to stop audio session:', error);
            sendRetryStatus({
                sessionId,
                stage: 'error',
                error: error.message,
                retryAvailable: Boolean(pendingRetryService.getPendingRetry()),
                lingerMs: 6500
            });
        });
    });

    ipcMain.handle('history:export', async (event, format = 'txt') => {
        try {
            const history = await historyService.getHistory();

            if (!history || history.length === 0) {
                return { success: false, error: 'No history to export' };
            }

            const { filePath } = await dialog.showSaveDialog({
                filters: [
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'Markdown Files', extensions: ['md'] }
                ],
                defaultPath: `koe-transcriptions.${format}`,
                properties: ['createDirectory']
            });

            if (!filePath) {
                return { success: false, cancelled: true };
            }

            const date = new Date();
            const dateHeader = date.toLocaleDateString();
            const separator = '='.repeat(40);

            let content = `Koe Transcriptions - ${dateHeader}\n${separator}\n\n`;

            history.forEach((entry) => {
                const entryDate = new Date(entry.timestamp);
                const timeString = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                content += `${timeString} - ${(entry.refinedText || entry.text || '').trim()}\n\n`;
            });

            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, filePath };
        } catch (error) {
            logger.error('[Export] Error exporting history:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:open-logs', async () => {
        try {
            const logDir = logger.getLogDirectory();
            await shell.openPath(logDir);
            return { success: true, path: logDir };
        } catch (error) {
            logger.error('[IPC] Failed to open logs folder:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:is-packaged', () => app.isPackaged);
    ipcMain.handle('app:resources-path', () => process.resourcesPath);
}

module.exports = {
    setupIpcHandlers
};
