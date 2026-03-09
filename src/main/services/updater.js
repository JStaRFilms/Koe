const { app, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const logger = require('./logger');

const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000;

let updateInterval = null;
let startupCheckTimeout = null;
let updaterInitialized = false;
let downloadNoticeShownForVersion = null;

function showUpdateReadyNotification(version) {
    if (!Notification.isSupported()) {
        return;
    }

    new Notification({
        title: 'Koe update ready',
        body: `Version ${version} has been downloaded and will install when you quit Koe.`
    }).show();
}

function configureAutoUpdater() {
    if (updaterInitialized) {
        return;
    }

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = logger;

    autoUpdater.on('checking-for-update', () => {
        logger.info('[Updater] Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        logger.info(`[Updater] Update available: ${info.version}`);
    });

    autoUpdater.on('update-not-available', () => {
        logger.info('[Updater] No update available.');
    });

    autoUpdater.on('update-downloaded', (info) => {
        logger.info(`[Updater] Update downloaded: ${info.version}`);
        if (downloadNoticeShownForVersion !== info.version) {
            downloadNoticeShownForVersion = info.version;
            showUpdateReadyNotification(info.version);
        }
    });

    autoUpdater.on('error', (error) => {
        logger.error('[Updater] Auto-update error:', error);
    });

    updaterInitialized = true;
}

async function checkForUpdates(reason = 'manual') {
    if (!app.isPackaged) {
        logger.info(`[Updater] Skipping ${reason} update check in development.`);
        return;
    }

    configureAutoUpdater();

    try {
        logger.info(`[Updater] Running ${reason} update check.`);
        await autoUpdater.checkForUpdates();
    } catch (error) {
        logger.error(`[Updater] ${reason} update check failed:`, error);
    }
}

function clearAutoUpdateSchedule() {
    if (startupCheckTimeout) {
        clearTimeout(startupCheckTimeout);
        startupCheckTimeout = null;
    }

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

function applyAutoUpdatePreference(enabled) {
    clearAutoUpdateSchedule();

    if (!enabled) {
        logger.info('[Updater] Automatic update checks disabled by settings.');
        return;
    }

    if (!app.isPackaged) {
        logger.info('[Updater] Automatic update checks are enabled, but skipped in development.');
        return;
    }

    configureAutoUpdater();

    startupCheckTimeout = setTimeout(() => {
        checkForUpdates('startup');
    }, 15000);

    updateInterval = setInterval(() => {
        checkForUpdates('scheduled');
    }, UPDATE_CHECK_INTERVAL_MS);

    logger.info(`[Updater] Scheduled automatic update checks every ${UPDATE_CHECK_INTERVAL_MS}ms.`);
}

module.exports = {
    applyAutoUpdatePreference,
    checkForUpdates
};
