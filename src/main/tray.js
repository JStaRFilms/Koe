const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const { CHANNELS } = require('../shared/constants');

let tray = null;
let isRecording = false;

function setupTray(mainWindow) {
    const iconPath = path.join(__dirname, '../assets/icons/tray-icon.png');
    tray = new Tray(iconPath);
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
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.showInactive();
                    mainWindow.webContents.send(CHANNELS.OPEN_SETTINGS);
                }
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
