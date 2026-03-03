/**
 * Settings Window Manager
 * Handles creation and lifecycle of the secondary settings window
 */

const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { CHANNELS } = require('../shared/constants');

let settingsWindow = null;

/**
 * Create the settings window
 * @param {string} initialTab - Tab to open initially ('settings', 'history', 'usage')
 * @returns {BrowserWindow} The created window
 */
function createSettingsWindow(initialTab = 'settings') {
    // If window already exists, just show it and switch tab
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.show();
        settingsWindow.focus();

        // Send message to switch to desired tab
        settingsWindow.webContents.send(getTabChannel(initialTab));
        return settingsWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

    // Window dimensions
    const windowWidth = 600;
    const windowHeight = 500;

    // Center on screen
    const windowX = Math.round((screenW - windowWidth) / 2);
    const windowY = Math.round((screenH - windowHeight) / 2);

    settingsWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: windowX,
        y: windowY,
        frame: false,
        transparent: false,
        alwaysOnTop: false,
        resizable: false,
        skipTaskbar: false,
        focusable: true,
        show: false,
        hasShadow: true,
        title: 'Koe Settings',
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the settings window HTML
    const isDev = !require('electron').app.isPackaged;
    if (isDev) {
        settingsWindow.loadURL('http://localhost:5173/settings-window.html');
    } else {
        settingsWindow.loadFile(path.join(__dirname, '../../dist/renderer/settings-window.html'));
    }

    // Show window when ready
    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
        settingsWindow.focus();

        // Send initial tab command
        settingsWindow.webContents.send(getTabChannel(initialTab));
    });

    // Intercept close to hide instead (unless app is quitting)
    settingsWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            settingsWindow.hide();
        }
    });

    // Handle window closed (only happens when app is quitting now)
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });

    // Prevent navigation
    settingsWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault();
    });

    return settingsWindow;
}

/**
 * Get the IPC channel for a tab name
 */
function getTabChannel(tabName) {
    const channelMap = {
        'settings': CHANNELS.OPEN_SETTINGS_TAB,
        'history': CHANNELS.OPEN_HISTORY_TAB,
        'usage': CHANNELS.OPEN_USAGE_TAB
    };
    return channelMap[tabName] || CHANNELS.OPEN_SETTINGS_TAB;
}

/**
 * Close the settings window
 */
function closeSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.hide();
    }
}

/**
 * Check if settings window is open
 */
function isSettingsWindowOpen() {
    return settingsWindow !== null && !settingsWindow.isDestroyed();
}

/**
 * Get the settings window instance
 */
function getSettingsWindow() {
    return settingsWindow;
}

module.exports = {
    createSettingsWindow,
    closeSettingsWindow,
    isSettingsWindowOpen,
    getSettingsWindow
};