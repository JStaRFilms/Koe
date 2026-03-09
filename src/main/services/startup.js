const { app } = require('electron');
const logger = require('./logger');

function getLaunchOnStartupState() {
    try {
        return app.getLoginItemSettings().openAtLogin;
    } catch (error) {
        logger.error('[Startup] Failed to read launch-on-startup state:', error);
        return false;
    }
}

function applyLaunchOnStartupPreference(enabled) {
    if (!app.isPackaged) {
        logger.info('[Startup] Skipping launch-on-startup changes in development.');
        return true;
    }

    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            enabled,
            openAsHidden: true,
            path: process.execPath
        });

        const appliedState = getLaunchOnStartupState();
        logger.info(`[Startup] Launch on startup set to ${appliedState}. Requested: ${enabled}.`);
        return appliedState === enabled;
    } catch (error) {
        logger.error('[Startup] Failed to apply launch-on-startup preference:', error);
        return false;
    }
}

module.exports = {
    applyLaunchOnStartupPreference,
    getLaunchOnStartupState
};
