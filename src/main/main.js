const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { setupTray } = require('./tray');
const { registerShortcuts, unregisterShortcuts } = require('./shortcuts');
const { setupIpcHandlers } = require('./ipc');
const { createSettingsWindow } = require('./settings-window');

let mainWindow = null;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

    // Pill dimensions: 400 wide, 68 tall (56 pill + padding for glow/shadow)
    const pillWidth = 400;
    const pillHeight = 68;
    const pillX = Math.round((screenW - pillWidth) / 2);
    const pillY = screenH - pillHeight - 16; // 16px from bottom edge

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
        focusable: false, // CRITICAL: never steal focus from user's active app
        show: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the Vite dev server URL in development, or the local HTML file in production
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    }

    // Show window when ready (critical for production)
    mainWindow.once('ready-to-show', () => {
        mainWindow.showInactive();
    });

    // When window is shown, tell renderer to play entrance animation
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
        console.log('[Main] App starting...');
        console.log('[Main] __dirname:', __dirname);
        console.log('[Main] app.getAppPath():', app.getAppPath());
        console.log('[Main] process.resourcesPath:', process.resourcesPath);
        console.log('[Main] isPackaged:', app.isPackaged);

        createWindow();

        if (!mainWindow) {
            console.error('[Main] Failed to create main window');
            return;
        }

        setupTray(mainWindow);
        registerShortcuts(mainWindow);
        setupIpcHandlers(mainWindow);

        console.log('[Main] App started successfully');
    } catch (error) {
        console.error('[Main] Error during startup:', error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // This is a tray app that runs in the background.
    // Do not quit when the settings or pill window is closed.
});

app.on('before-quit', () => {
    app.isQuitting = true;
    unregisterShortcuts();
});

module.exports = {
    getMainWindow,
    createSettingsWindow
};
