const { ipcMain, dialog, shell, app } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { processAudio, validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const { autoPaste } = require('./services/clipboard');
const historyService = require('./services/history');
const { retryAndPasteTranscript } = require('./services/retry-transcript');
const pendingRetryService = require('./services/pending-retry');
const { closeSettingsWindow } = require('./settings-window');
const { updateHotkey } = require('./shortcuts');
const { applyLaunchOnStartupPreference } = require('./services/startup');
const { applyAutoUpdatePreference } = require('./services/updater');
const logger = require('./services/logger');
const fs = require('fs');

let mainWindowRef = null;

function countWords(text) {
    return String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;
}

function isSuspiciouslyShortTranscript(text, audioSeconds) {
    if (!text || !audioSeconds || audioSeconds < 5) {
        return false;
    }

    return countWords(text) <= 3;
}

function sendTranscriptionStatus(status) {
    if (!mainWindowRef || mainWindowRef.isDestroyed()) {
        return;
    }

    if (status?.stage && status.stage !== 'error' && !mainWindowRef.isVisible()) {
        mainWindowRef.showInactive();
    }

    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, status);
}

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hideSettingsBeforePaste() {
    closeSettingsWindow();
    await wait(200);
}

async function processAudioChunk(audioData) {
    const { buffer, audioSeconds, sessionId } = audioData;
    const settings = getSettings();

    pendingRetryService.savePendingRetry(audioData, {
        language: settings.language || 'auto',
        enhanceText: settings.enhanceText !== false,
        promptStyle: settings.promptStyle || 'Clean',
        customPrompt: settings.customPrompt || '',
        model: settings.model || 'whisper-large-v3-turbo'
    });

    logger.info(`[Pipeline] Received audio chunk for session ${sessionId}: ${buffer?.byteLength || 'N/A'} bytes, ${audioSeconds?.toFixed(1)}s`);
    logger.info(
        `[Pipeline] Session ${sessionId} settings: model=${settings.model || 'whisper-large-v3-turbo'}, ` +
        `language=${settings.language || 'auto'}, enhance=${settings.enhanceText !== false}, autoPaste=${settings.autoPaste !== false}`
    );

    sendTranscriptionStatus({
        sessionId,
        stage: 'uploading',
        label: 'Uploading',
        progress: 16
    });

    logger.info('[Pipeline] Starting transcription pipeline...');
    const result = await processAudio(buffer, audioSeconds, {
        language: settings.language || 'auto',
        enhanceText: settings.enhanceText !== false,
        promptStyle: settings.promptStyle || 'Clean',
        customPrompt: settings.customPrompt || '',
        model: settings.model || 'whisper-large-v3-turbo',
        onStage: (status) => {
            sendTranscriptionStatus({
                sessionId,
                stage: status.stage,
                label: status.label,
                progress: status.progress
            });
        }
    });

    const rawText = result?.rawText || '';

    if (!rawText) {
        pendingRetryService.clearPendingRetry();
        sendTranscriptionStatus({
            sessionId,
            stage: 'empty',
            label: 'No speech detected',
            progress: 0
        });
        return null;
    }

    logger.info(`[Pipeline] Raw transcription result: "${rawText.substring(0, 80) || 'null'}"`);

    if (isSuspiciouslyShortTranscript(rawText, audioSeconds)) {
        logger.warn(
            `[Pipeline] Session ${sessionId} produced a very short transcript for a ${audioSeconds.toFixed(1)}s chunk. ` +
            'This usually indicates low-signal audio, silence, or the wrong microphone input.'
        );
    }

    const refinedText = result?.refinedText || rawText;
    logger.info(`[Pipeline] Final result: "${refinedText.substring(0, 80) || 'null'}"`);

    await wait(200);

    if (settings.autoPaste !== false) {
        autoPaste(refinedText);
    }

    historyService.addHistoryEntry({
        rawText,
        refinedText,
        language: settings.language || 'auto',
        isLlamaEnhanced: settings.enhanceText && !!refinedText,
        source: 'transcription'
    });

    pendingRetryService.clearPendingRetry();

    return { rawText, refinedText, sessionId };
}

function setupIpcHandlers(mainWindow) {
    mainWindowRef = mainWindow;

    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => getSettings());

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        const oldSettings = getSettings();
        setSettings(newSettings);

        if (newSettings.hotkey && newSettings.hotkey !== oldSettings.hotkey) {
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                const success = updateHotkey(mainWindowRef, newSettings.hotkey);
                if (!success) {
                    setSettings({ ...newSettings, hotkey: oldSettings.hotkey });
                    throw new Error(`Failed to register hotkey "${newSettings.hotkey}". It may be invalid or already in use.`);
                }
            }
        }

        if (newSettings.launchOnStartup !== oldSettings.launchOnStartup) {
            const applied = applyLaunchOnStartupPreference(newSettings.launchOnStartup !== false);
            if (!applied) {
                setSettings({ ...newSettings, launchOnStartup: oldSettings.launchOnStartup });
                throw new Error('Failed to update launch-on-startup preference.');
            }
        }

        if (newSettings.autoUpdate !== oldSettings.autoUpdate) {
            applyAutoUpdatePreference(newSettings.autoUpdate !== false);
        }

        return true;
    });

    ipcMain.handle(CHANNELS.TEST_GROQ_KEY, async (event, apiKey) => validateApiKey(apiKey));
    ipcMain.handle(CHANNELS.GET_USAGE_STATS, async () => rateLimiter.getUsageStats());
    ipcMain.handle(CHANNELS.GET_HISTORY, async () => historyService.getHistory());
    ipcMain.handle(CHANNELS.CLEAR_HISTORY, async () => historyService.clearHistory());

    ipcMain.handle(CHANNELS.RETRY_HISTORY_ENTRY, async (event, entryId) => {
        const result = await retryAndPasteTranscript(entryId, {
            beforePaste: hideSettingsBeforePaste
        });
        return result;
    });

    ipcMain.handle(CHANNELS.RETRY_LAST_TRANSCRIPT, async () => {
        const result = await retryAndPasteTranscript(null);
        return result;
    });

    ipcMain.on(CHANNELS.LOG, (event, message) => {
        logger.info('[Renderer]', message);
    });

    ipcMain.on(CHANNELS.WINDOW_MINIMIZE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.minimize();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_CLOSE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.hide();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_HIDE, () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.hide();
        }
    });

    ipcMain.on(CHANNELS.CLOSE_SETTINGS_WINDOW, () => {
        closeSettingsWindow();
    });

    ipcMain.on(CHANNELS.AUDIO_CHUNK, async (event, audioData) => {
        try {
            const result = await processAudioChunk(audioData);

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }

            if (result?.refinedText) {
                if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, result.refinedText);
                    mainWindowRef.webContents.send(CHANNELS.TRANSCRIPTION_COMPLETE, {
                        text: result.refinedText,
                        sessionId: result.sessionId
                    });
                }
            }

            logger.info('[Pipeline] Done.');
        } catch (error) {
            logger.error('[Pipeline] Transcription error:', error);
            pendingRetryService.markPendingRetryError(error.message);
            const retryAvailable = Boolean(pendingRetryService.getPendingRetry());
            sendTranscriptionStatus({
                sessionId: audioData?.sessionId,
                stage: 'error',
                error: error.message,
                retryAvailable,
                lingerMs: retryAvailable ? 6500 : 3500
            });

            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
        }
    });

    ipcMain.handle('history:export', async (event, format = 'txt') => {
        try {
            const history = await historyService.getHistory();

            if (!history || history.length === 0) {
                return { success: false, error: 'No history to export' };
            }

            const { filePath } = await dialog.showSaveDialog({
                filters: [
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'Markdown Files', extensions: ['md'] }
                ],
                defaultPath: `koe-transcriptions.${format}`,
                properties: ['createDirectory']
            });

            if (!filePath) {
                return { success: false, cancelled: true };
            }

            const date = new Date();
            const dateHeader = date.toLocaleDateString();
            const separator = '='.repeat(40);

            let content = `Koe Transcriptions - ${dateHeader}\n${separator}\n\n`;

            history.forEach((entry) => {
                const entryDate = new Date(entry.timestamp);
                const timeString = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                content += `${timeString} - ${(entry.refinedText || entry.text || '').trim()}\n\n`;
            });

            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, filePath };
        } catch (error) {
            logger.error('[Export] Error exporting history:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:open-logs', async () => {
        try {
            const logDir = logger.getLogDirectory();
            logger.info('[IPC] Opening logs folder:', logDir);
            await shell.openPath(logDir);
            return { success: true, path: logDir };
        } catch (error) {
            logger.error('[IPC] Failed to open logs folder:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:is-packaged', () => app.isPackaged);
    ipcMain.handle('app:resources-path', () => process.resourcesPath);
}

module.exports = {
    setupIpcHandlers
};
