const { ipcMain } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { transcribe, enhance, validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const { autoPaste } = require('./services/clipboard');
const historyService = require('./services/history');

function setupIpcHandlers(mainWindow) {
    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
        return getSettings();
    });

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        setSettings(newSettings);
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
        console.log('[Renderer]', message);
    });

    ipcMain.on(CHANNELS.WINDOW_MINIMIZE, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_CLOSE, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide();
        }
    });

    // Hide the pill window (called by renderer after auto-hide delay)
    ipcMain.on(CHANNELS.WINDOW_HIDE, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide();
        }
    });

    // Audio chunk → transcription → auto-paste pipeline
    ipcMain.on(CHANNELS.AUDIO_CHUNK, async (event, audioData) => {
        try {
            const { buffer, audioSeconds } = audioData;
            const settings = getSettings();
            console.log(`[Pipeline] Received audio chunk: ${buffer?.byteLength || 'N/A'} bytes, ${audioSeconds?.toFixed(1)}s`);

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'processing');
            }

            console.log('[Pipeline] Calling Groq transcribe...');
            let text = await transcribe(buffer, audioSeconds, settings.language || 'auto');
            console.log(`[Pipeline] Transcription result: "${text?.substring(0, 80) || 'null'}"`);

            if (text && settings.enhanceText) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'enhancing');
                }
                console.log('[Pipeline] Enhancing text...');
                text = await enhance(text, settings.promptStyle || 'Clean');
                console.log(`[Pipeline] Enhanced: "${text?.substring(0, 80) || 'null'}"`);
            }

            // Auto-paste is now always on by default
            if (text) {
                console.log('[Pipeline] Hiding pill and preparing to paste...');
                // Hide the pill before pasting so focus returns to the user's app
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.hide();
                }

                // Small delay to let OS focus the previous window
                await new Promise(r => setTimeout(r, 200));
                console.log('[Pipeline] Firing autoPaste...');
                autoPaste(text);

                historyService.addHistoryEntry(text, settings.language || 'auto', settings.enhanceText && !!text);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, text);
                }
            }
            console.log('[Pipeline] Done.');
        } catch (error) {
            console.error('[Pipeline] Transcription error:', error);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, `error: ${error.message}`);
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
        }
    });
}

module.exports = {
    setupIpcHandlers
};
