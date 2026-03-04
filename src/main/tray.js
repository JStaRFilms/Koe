const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const { CHANNELS } = require('../shared/constants');
const { createSettingsWindow } = require('./settings-window');
const fs = require('fs');

let tray = null;
let isRecording = false;

function setupTray(mainWindow) {
    // Try multiple possible icon paths (dev vs production)
    const possiblePaths = [
        path.join(__dirname, '../assets/icons/tray-icon.png'),  // Dev path
        path.join(__dirname, '../../../assets/icons/tray-icon.png'),  // Production unpacked
        path.join(process.resourcesPath, 'assets/icons/tray-icon.png'),  // Asar resources
        path.join(app.getAppPath(), 'assets/icons/tray-icon.png'),  // App root
    ];

    let iconPath = null;
    for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
            iconPath = tryPath;
            console.log('[Tray] Found icon at:', iconPath);
            break;
        }
    }

    // If no icon found, create a default empty icon (1x1 transparent PNG)
    if (!iconPath) {
        console.error('[Tray] Warning: tray-icon.png not found in any expected location');
        console.error('[Tray] Checked paths:', possiblePaths);
        // Create a 1x1 transparent icon as fallback
        const emptyIcon = nativeImage.createEmpty();
        tray = new Tray(emptyIcon);
    } else {
        tray = new Tray(iconPath);
    }
    tray.setToolTip('Koe — Ready');

    // Single click on tray: toggle pill visibility
    tray.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.showInactive();
            }
        }
    });

    updateContextMenu(mainWindow);
}

function updateContextMenu(mainWindow) {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        {
            label: isRecording ? '⏹ Stop Recording' : '⏺ Start Recording',
            click: () => {
                isRecording = !isRecording;
                updateContextMenu(mainWindow);
                tray.setToolTip(isRecording ? 'Koe — Recording' : 'Koe — Ready');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (isRecording) {
                        mainWindow.showInactive();
                    }
                    mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, isRecording);
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Settings...',
            click: () => {
                createSettingsWindow('settings');
            }
        },
        {
            label: 'History...',
            click: () => {
                createSettingsWindow('history');
            }
        },
        {
            label: 'Usage...',
            click: () => {
                createSettingsWindow('usage');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Koe',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function setRecordingState(state, mainWindow) {
    isRecording = state;
    if (tray) {
        updateContextMenu(mainWindow);
        tray.setToolTip(isRecording ? 'Koe — Recording' : 'Koe — Ready');
    }
}

module.exports = {
    setupTray,
    setRecordingState
};
