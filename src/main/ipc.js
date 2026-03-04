const { ipcMain, dialog, shell, app } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings, getSetting } = require('./services/settings');
const { transcribe, enhance, validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const { autoPaste } = require('./services/clipboard');
const historyService = require('./services/history');
const { closeSettingsWindow } = require('./settings-window');
const { updateHotkey } = require('./shortcuts');
const logger = require('./services/logger');
const fs = require('fs');
const path = require('path');

let mainWindowRef = null;

function setupIpcHandlers(mainWindow) {
    mainWindowRef = mainWindow;

    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
        return getSettings();
    });

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        const oldSettings = getSettings();
        setSettings(newSettings);

        // Handle hotkey change
        if (newSettings.hotkey && newSettings.hotkey !== oldSettings.hotkey) {
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                const success = updateHotkey(mainWindowRef, newSettings.hotkey);
                if (!success) {
                    // Revert hotkey in settings if registration failed
                    setSettings({ ...newSettings, hotkey: oldSettings.hotkey });
                    throw new Error(`Failed to register hotkey "${newSettings.hotkey}". It may be invalid or already in use.`);
                }
            }
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

    // Hide the pill window (called by renderer after auto-hide delay)
    ipcMain.on(CHANNELS.WINDOW_HIDE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.hide();
        }
    });

    // Close settings window
    ipcMain.on(CHANNELS.CLOSE_SETTINGS_WINDOW, () => {
        closeSettingsWindow();
    });

    // Audio chunk → transcription → auto-paste pipeline
    ipcMain.on(CHANNELS.AUDIO_CHUNK, async (event, audioData) => {
        try {
            const { buffer, audioSeconds } = audioData;
            const settings = getSettings();
            logger.info(`[Pipeline] Received audio chunk: ${buffer?.byteLength || 'N/A'} bytes, ${audioSeconds?.toFixed(1)}s`);

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'processing');
            }

            logger.info('[Pipeline] Calling Groq transcribe...');
            let text = await transcribe(buffer, audioSeconds, settings.language || 'auto');
            logger.info(`[Pipeline] Transcription result: "${text?.substring(0, 80) || 'null'}"`);

            if (text && settings.enhanceText) {
                if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'enhancing');
                }
                logger.info('[Pipeline] Enhancing text...');
                text = await enhance(text, settings.promptStyle || 'Clean');
                logger.info(`[Pipeline] Enhanced: "${text?.substring(0, 80) || 'null'}"`);
            }

            // Auto-paste is now always on by default
            if (text) {
                logger.info('[Pipeline] Hiding pill and preparing to paste...');
                // Hide the pill before pasting so focus returns to the user's app
                if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                    mainWindowRef.hide();
                }

                // Small delay to let OS focus the previous window
                await new Promise(r => setTimeout(r, 200));
                logger.info('[Pipeline] Firing autoPaste...');
                autoPaste(text);

                historyService.addHistoryEntry(text, settings.language || 'auto', settings.enhanceText && !!text);
            }

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, text);
                }
            }
            logger.info('[Pipeline] Done.');
        } catch (error) {
            logger.error('[Pipeline] Transcription error:', error);
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, `error: ${error.message}`);
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
        }
    });

    // Export history to file
    ipcMain.handle('history:export', async (event, format = 'txt') => {
        try {
            const history = await historyService.getHistory();

            if (!history || history.length === 0) {
                return { success: false, error: 'No history to export' };
            }

            // Show save dialog
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

            // Format the content
            const date = new Date();
            const dateHeader = date.toLocaleDateString();
            const separator = '='.repeat(40);

            let content = `Koe Transcriptions — ${dateHeader}\n${separator}\n\n`;

            history.forEach(entry => {
                const entryDate = new Date(entry.timestamp);
                const timeString = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                content += `${timeString} - ${entry.text}\n\n`;
            });

            // Write to file
            fs.writeFileSync(filePath, content, 'utf8');

            return { success: true, filePath };
        } catch (error) {
            logger.error('[Export] Error exporting history:', error);
            return { success: false, error: error.message };
        }
    });

    // Open logs folder in file explorer
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

    // Check if app is packaged (production) or in dev mode
    ipcMain.handle('app:is-packaged', () => {
        return app.isPackaged;
    });

    // Get the resources path (needed for VAD asset resolution in production)
    ipcMain.handle('app:resources-path', () => {
        return process.resourcesPath;
    });
}

module.exports = {
    setupIpcHandlers
};
