const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { setupTray } = require('./tray');
const { registerShortcuts, unregisterShortcuts } = require('./shortcuts');
const { setupIpcHandlers } = require('./ipc');
const { createSettingsWindow } = require('./settings-window');
const { getSetting } = require('./services/settings');
const { applyLaunchOnStartupPreference } = require('./services/startup');
const { applyAutoUpdatePreference } = require('./services/updater');
const sessionManager = require('./services/transcription-session-manager');
const logger = require('./services/logger');

let mainWindow = null;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

    const pillWidth = 480;
    const pillHeight = 160;
    const pillX = Math.round((screenW - pillWidth) / 2);
    const pillY = screenH - pillHeight - 16;

    mainWindow = new BrowserWindow({
        width: pillWidth,
        height: pillHeight,
        x: pillX,
        y: pillY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        focusable: false,
        show: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    }

    mainWindow.on('show', () => {
        const { CHANNELS } = require('../shared/constants');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(CHANNELS.WINDOW_ANIMATE_IN);
        }
    });
}

function getMainWindow() {
    return mainWindow;
}

app.whenReady().then(() => {
    try {
        logger.info('[Main] App starting...');
        logger.info('[Main] __dirname:', __dirname);
        logger.info('[Main] app.getAppPath():', app.getAppPath());
        logger.info('[Main] process.resourcesPath:', process.resourcesPath);
        logger.info('[Main] isPackaged:', app.isPackaged);
        logger.info('[Main] Log file location:', logger.getLogPath());

        createWindow();

        if (!mainWindow) {
            logger.error('[Main] Failed to create main window');
            return;
        }

        setupTray(mainWindow);
        registerShortcuts(mainWindow);
        setupIpcHandlers(mainWindow);

        applyLaunchOnStartupPreference(getSetting('launchOnStartup') !== false);
        applyAutoUpdatePreference(getSetting('autoUpdate') !== false);

        logger.info('[Main] App started successfully');
    } catch (error) {
        logger.error('[Main] Error during startup:', error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Tray app: stay alive in the background.
});

app.on('before-quit', () => {
    app.isQuitting = true;
    unregisterShortcuts();
    sessionManager.shutdown();
});

module.exports = {
    getMainWindow,
    createSettingsWindow
};
