const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let isRecording = false;

function setupTray(mainWindow) {
    const iconPath = path.join(__dirname, '../assets/icons/tray-icon.png');
    tray = new Tray(iconPath);
    tray.setToolTip('Koe — Idle');

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
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
                // Toggle recording logic via IPC
                const { CHANNELS } = require('../shared/constants');
                isRecording = !isRecording;
                updateContextMenu(mainWindow);
                tray.setToolTip(isRecording ? 'Koe — Recording' : 'Koe — Idle');
                if (mainWindow) {
                    mainWindow.webContents.send(CHANNELS.RECORDING_TOGGLED, isRecording);
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    // Ideally send an IPC event to tell renderer to open settings view
                }
            }
        },
        {
            label: 'Quit',
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
        tray.setToolTip(isRecording ? 'Koe — Recording' : 'Koe — Idle');
    }
}

module.exports = {
    setupTray,
    setRecordingState
};
