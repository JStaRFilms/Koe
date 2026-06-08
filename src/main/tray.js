const { Tray, Menu, app, nativeImage, dialog, clipboard } = require('electron');
const path = require('path');
const { CHANNELS } = require('../shared/constants');
const { createSettingsWindow } = require('./settings-window');
const { getRecordingState, toggleRecording } = require('./services/recording-state');
const { showPillWindow } = require('./services/pill-window');
const { ensureProcessingReady } = require('./services/processing-readiness');
const { processAudio } = require('./services/groq');
const { getSettings } = require('./services/settings');
const historyService = require('./services/history');
const fs = require('fs');

const logger = require('./services/logger');

const MAX_AUDIO_UPLOAD_BYTES = 20 * 1024 * 1024;

let tray = null;
let isRecording = false;
let importSessionId = 100000;

function inferAudioContentType(fileName = '') {
    const normalizedName = String(fileName || '').trim().toLowerCase();
    if (normalizedName.endsWith('.mp3')) return 'audio/mpeg';
    if (normalizedName.endsWith('.m4a')) return 'audio/mp4';
    if (normalizedName.endsWith('.wav')) return 'audio/wav';
    if (normalizedName.endsWith('.webm')) return 'audio/webm';
    if (normalizedName.endsWith('.ogg')) return 'audio/ogg';
    if (normalizedName.endsWith('.flac')) return 'audio/flac';
    if (normalizedName.endsWith('.aac')) return 'audio/aac';
    if (normalizedName.endsWith('.mp4')) return 'audio/mp4';
    return 'application/octet-stream';
}

function sendImportStatus(mainWindow, status) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, {
        ...status,
        forceDisplay: true
    });
}

function sendImportComplete(mainWindow, payload) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, {
        ...payload,
        forceDisplay: true
    });
}

async function importAudioFile(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    if (!ensureProcessingReady(mainWindow)) {
        logger.warn('Audio import blocked because no account session or local Groq key is configured.');
        return;
    }

    const result = await dialog.showOpenDialog({
        title: 'Import audio file',
        properties: ['openFile'],
        filters: [
            { name: 'Audio Files', extensions: ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'aac', 'mp4'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (result.canceled || !result.filePaths?.[0]) {
        return;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const sessionId = ++importSessionId;

    try {
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_AUDIO_UPLOAD_BYTES) {
            throw new Error('Audio file is too large. Keep uploads under 20 MB.');
        }

        showPillWindow(mainWindow);
        sendImportStatus(mainWindow, {
            sessionId,
            stage: 'uploading',
            label: 'Importing audio',
            detail: fileName,
            progress: 8
        });

        const settings = getSettings();
        const audioBuffer = fs.readFileSync(filePath);
        const processed = await processAudio(audioBuffer, 0, {
            requestId: `desktop-import-${Date.now()}`,
            clientSessionId: `desktop-import-${Date.now()}`,
            fileName,
            contentType: inferAudioContentType(fileName),
            enhanceText: settings.enhanceText !== false,
            onStage: (stage) => sendImportStatus(mainWindow, { sessionId, ...stage })
        });

        const rawText = String(processed?.rawText || '').trim();
        const refinedText = String(processed?.refinedText || '').trim() || rawText;
        const transcript = refinedText || rawText;

        if (!transcript || processed?.empty) {
            sendImportStatus(mainWindow, {
                sessionId,
                stage: 'empty',
                label: 'No speech detected',
                detail: fileName,
                progress: 100
            });
            return;
        }

        clipboard.writeText(transcript);
        historyService.addHistoryEntry({
            rawText,
            refinedText,
            language: settings.language || 'auto',
            isLlamaEnhanced: refinedText !== rawText,
            source: 'upload'
        });

        sendImportStatus(mainWindow, {
            sessionId,
            stage: 'refining',
            label: settings.enhanceText !== false ? 'Copied refined transcript' : 'Copied raw transcript',
            detail: 'Imported audio transcript copied to clipboard.',
            progress: 96
        });
        sendImportComplete(mainWindow, { sessionId, text: transcript });
    } catch (error) {
        logger.error('[Tray Import] Audio import failed:', error);
        showPillWindow(mainWindow);
        sendImportStatus(mainWindow, {
            sessionId,
            stage: 'error',
            error: error.message || 'Audio import failed.',
            detail: fileName
        });
    }
}


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
                if (!getRecordingState().isRecording && !ensureProcessingReady(mainWindow)) {
                    logger.warn('Recording blocked because no account session or local Groq key is configured.');
                    return;
                }

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
        {
            label: 'Import Audio File...',
            enabled: !isRecording,
            click: () => {
                void importAudioFile(mainWindow);
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
