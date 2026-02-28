const { ipcMain } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { transcribe } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');

function setupIpcHandlers(mainWindow) {
    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
        return getSettings();
    });

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        setSettings(newSettings);
        return true;
    });

    ipcMain.handle(CHANNELS.GET_USAGE_STATS, async () => {
        return rateLimiter.getUsageStats();
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

    ipcMain.handle(CHANNELS.AUDIO_CHUNK, async (event, { buffer, audioSeconds }) => {
        try {
            const settings = getSettings();

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'processing');
            }

            const text = await transcribe(buffer, audioSeconds, settings.language || 'auto');

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                }
            }
            return text;
        } catch (error) {
            console.error('Transcription error:', error);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, `error: ${error.message}`);
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
            throw error;
        }
    });
}

module.exports = {
    setupIpcHandlers
};
