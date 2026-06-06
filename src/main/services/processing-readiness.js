const { CHANNELS } = require('../../shared/constants');
const { getSettings } = require('./settings');
const accountClient = require('./account-client');
const { showPillWindow } = require('./pill-window');

function hasProcessingCredentials(settings = getSettings()) {
    const hasLocalGroqKey = Boolean(String(settings.groqApiKey || '').trim());
    const hasAccountSession = Boolean(accountClient.getProcessingContext());
    return hasLocalGroqKey || hasAccountSession;
}

function showMissingProcessingCredentialsWarning(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    showPillWindow(mainWindow);
    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, {
        stage: 'error',
        error: 'Sign in to your Koe account or add a local Groq API key before recording.',
        detail: 'Open Settings to sign in, create an account, or save a local fallback key.',
        retryAvailable: false,
        forceDisplay: true,
        lingerMs: 7000
    });
}

function ensureProcessingReady(mainWindow) {
    if (hasProcessingCredentials()) {
        return true;
    }

    showMissingProcessingCredentialsWarning(mainWindow);
    return false;
}

module.exports = {
    ensureProcessingReady,
    hasProcessingCredentials,
    showMissingProcessingCredentialsWarning
};
