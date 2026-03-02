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
            mainWindow.hide(); // As per main.js logic, close hides it to tray
        }
    });

    // Use ipcMain.on() to match ipcRenderer.send() in preload.js (fire-and-forget)
    ipcMain.on(CHANNELS.AUDIO_CHUNK, async (event, audioData) => {
        try {
            const { buffer, audioSeconds } = audioData;
            const settings = getSettings();

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'processing');
            }

            let text = await transcribe(buffer, audioSeconds, settings.language || 'auto');

            if (text && settings.enhanceText) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'enhancing');
                }
                text = await enhance(text, settings.promptStyle || 'Clean');
            }

            if (text && settings.autoPaste) {
                autoPaste(text);
            }

            if (text) {
                historyService.addHistoryEntry(text, settings.language || 'auto', settings.enhanceText && !!text);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                }
            }
        } catch (error) {
            console.error('Transcription error:', error);
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
