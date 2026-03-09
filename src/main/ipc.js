const { ipcMain, dialog, shell, app } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { transcribe, enhance, validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const { autoPaste } = require('./services/clipboard');
const historyService = require('./services/history');
const { closeSettingsWindow } = require('./settings-window');
const { updateHotkey } = require('./shortcuts');
const { applyLaunchOnStartupPreference } = require('./services/startup');
const { applyAutoUpdatePreference } = require('./services/updater');
const logger = require('./services/logger');
const fs = require('fs');

let mainWindowRef = null;

function sendTranscriptionStatus(status) {
    if (!mainWindowRef || mainWindowRef.isDestroyed()) {
        return;
    }

    if (status?.stage && status.stage !== 'error' && !mainWindowRef.isVisible()) {
        mainWindowRef.showInactive();
    }

    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, status);
}

function setupIpcHandlers(mainWindow) {
    mainWindowRef = mainWindow;

    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
        return getSettings();
    });

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

    ipcMain.handle(CHANNELS.TEST_GROQ_KEY, async (event, apiKey) => {
        return validateApiKey(apiKey);
    });

    ipcMain.handle(CHANNELS.GET_USAGE_STATS, async () => {
        return rateLimiter.getUsageStats();
    });

    ipcMain.handle(CHANNELS.GET_HISTORY, async () => {
        return historyService.getHistory();
    });

    ipcMain.handle(CHANNELS.CLEAR_HISTORY, async () => {
        return historyService.clearHistory();
    });

    ipcMain.on(CHANNELS.LOG, (event, message) => {
        logger.info('[Renderer]', message);
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

    ipcMain.on(CHANNELS.AUDIO_CHUNK, async (event, audioData) => {
        const { buffer, audioSeconds, sessionId } = audioData;

        try {
            const settings = getSettings();
            logger.info(`[Pipeline] Received audio chunk for session ${sessionId}: ${buffer?.byteLength || 'N/A'} bytes, ${audioSeconds?.toFixed(1)}s`);

            sendTranscriptionStatus({
                sessionId,
                stage: 'transcribing',
                label: 'Transcribing',
                progress: 18
            });

            logger.info('[Pipeline] Calling Groq transcribe...');
            let text = await transcribe(buffer, audioSeconds, settings.language || 'auto');
            logger.info(`[Pipeline] Transcription result: "${text?.substring(0, 80) || 'null'}"`);

            if (text && settings.enhanceText) {
                sendTranscriptionStatus({
                    sessionId,
                    stage: 'enhancing',
                    label: 'Refining',
                    progress: 72
                });

                logger.info('[Pipeline] Enhancing text...');
                text = await enhance(text, settings.promptStyle || 'Clean');
                logger.info(`[Pipeline] Enhanced: "${text?.substring(0, 80) || 'null'}"`);
            }

            if (text) {
                sendTranscriptionStatus({
                    sessionId,
                    stage: 'pasting',
                    label: 'Pasting',
                    progress: 92
                });

                await new Promise(r => setTimeout(r, 200));
                logger.info('[Pipeline] Firing autoPaste...');
                autoPaste(text);

                historyService.addHistoryEntry(text, settings.language || 'auto', settings.enhanceText && !!text);
            } else {
                sendTranscriptionStatus({
                    sessionId,
                    stage: 'empty',
                    label: 'No speech detected',
                    progress: 0
                });
            }

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, { text, sessionId });
                }
            }

            logger.info('[Pipeline] Done.');
        } catch (error) {
            logger.error('[Pipeline] Transcription error:', error);
            sendTranscriptionStatus({
                sessionId,
                stage: 'error',
                error: error.message
            });

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
        }
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

            history.forEach(entry => {
                const entryDate = new Date(entry.timestamp);
                const timeString = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                content += `${timeString} - ${entry.text}\n\n`;
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
            logger.info('[IPC] Opening logs folder:', logDir);
            await shell.openPath(logDir);
            return { success: true, path: logDir };
        } catch (error) {
            logger.error('[IPC] Failed to open logs folder:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:is-packaged', () => {
        return app.isPackaged;
    });

    ipcMain.handle('app:resources-path', () => {
        return process.resourcesPath;
    });
}

module.exports = {
    setupIpcHandlers
};
