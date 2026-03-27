const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const { CHANNELS } = require('../shared/constants');
const { createSettingsWindow } = require('./settings-window');
const { toggleRecording } = require('./services/recording-state');
const { showPillWindow } = require('./services/pill-window');
const fs = require('fs');

const logger = require('./services/logger');

let tray = null;
let isRecording = false;

function resolveTrayIcon() {
    const possiblePaths = [
        path.join(__dirname, '../assets/icons/logo.png'),
        path.join(__dirname, '../../../assets/icons/logo.png'),
        path.join(process.resourcesPath, 'assets/icons/logo.png'),
        path.join(app.getAppPath(), 'assets/icons/logo.png'),
        path.join(__dirname, '../assets/icons/logo.svg'),
        path.join(__dirname, '../../../assets/icons/logo.svg'),
        path.join(process.resourcesPath, 'assets/icons/logo.svg'),
        path.join(app.getAppPath(), 'assets/icons/logo.svg'),
    ];

    for (const tryPath of possiblePaths) {
        if (!fs.existsSync(tryPath)) continue;

        const icon = nativeImage.createFromPath(tryPath);
        if (!icon.isEmpty()) {
            logger.info('[Tray] Found icon at:', tryPath);
            return icon.resize({ width: 16, height: 16 });
        }
    }

    logger.warn('[Tray] Warning: no usable tray icon found.');
    logger.debug('[Tray] Checked paths:', possiblePaths);
    return nativeImage.createEmpty();
}

function setupTray(mainWindow) {
    tray = new Tray(resolveTrayIcon());
    tray.setToolTip('Koe - Ready');

    tray.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                showPillWindow(mainWindow);
            }
        }
    });

    updateContextMenu(mainWindow);
}

function updateContextMenu(mainWindow) {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        {
            label: isRecording ? 'Stop Recording' : 'Start Recording',
            click: () => {
                const recordingState = toggleRecording();
                isRecording = recordingState.isRecording;
                updateContextMenu(mainWindow);
                tray.setToolTip(isRecording ? 'Koe - Recording' : 'Koe - Ready');

                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (isRecording) {
                        showPillWindow(mainWindow);
                    }
                    mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, recordingState);
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
        tray.setToolTip(isRecording ? 'Koe - Recording' : 'Koe - Ready');
    }
}

module.exports = {
    setupTray,
    setRecordingState
};
