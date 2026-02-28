const { ipcMain } = require('electron');
const { CHANNELS, DEFAULT_SETTINGS } = require('../shared/constants');

function setupIpcHandlers(mainWindow) {
    // Simple stub for getting settings
    ipcMain.handle(CHANNELS.GET_SETTINGS, async (event) => {
        // In a future phase, retrieve from electron-store Here we just return defaults for skeleton
        return DEFAULT_SETTINGS;
    });

    // Simple stub for saving settings
    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        // In a future phase, save to electron-store
        console.log('Main process received new settings to save:', newSettings);
        return true;
    });

    // Custom log handler for debugging 
    ipcMain.on(CHANNELS.LOG, (event, message) => {
        console.log('[Renderer]', message);
    });
}

module.exports = {
    setupIpcHandlers
};
