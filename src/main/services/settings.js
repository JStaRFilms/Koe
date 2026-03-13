const Store = require('electron-store').default || require('electron-store');
const { DEFAULT_SETTINGS } = require('../../shared/constants');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('./logger');

let store = null;

const SETTINGS_MIGRATIONS_KEY = '__settingsMigrationsApplied';
// Policy:
// - Change DEFAULT_SETTINGS when you want new installs or missing keys to get a new default.
// - Add a SETTINGS_MIGRATIONS entry with mode "preserve" when you want to backfill a setting
//   for existing users without overriding what they already chose.
// - Add a SETTINGS_MIGRATIONS entry with mode "force" when you want to roll every existing
//   install forward or back to a specific value.
const SETTINGS_MIGRATIONS = [
    {
        id: '2026-03-12-disable-cloud-processing-proxy',
        mode: 'force',
        changes: {
            cloudProcessingEnabled: false
        }
    }
];

function applyMigration(settings, migration) {
    const nextSettings = { ...settings };

    for (const [key, value] of Object.entries(migration.changes || {})) {
        if (migration.mode === 'preserve') {
            if (nextSettings[key] === undefined) {
                nextSettings[key] = value;
            }
            continue;
        }

        nextSettings[key] = value;
    }

    return nextSettings;
}

function applySettingsMigrations(targetStore) {
    const appliedMigrations = new Set(targetStore.get(SETTINGS_MIGRATIONS_KEY, []));
    let nextSettings = { ...targetStore.store };
    delete nextSettings[SETTINGS_MIGRATIONS_KEY];

    let settingsChanged = false;
    let migrationsChanged = false;

    for (const migration of SETTINGS_MIGRATIONS) {
        if (appliedMigrations.has(migration.id)) {
            continue;
        }

        const migratedSettings = applyMigration(nextSettings, migration);
        const didChange = JSON.stringify(migratedSettings) !== JSON.stringify(nextSettings);

        nextSettings = migratedSettings;
        appliedMigrations.add(migration.id);
        migrationsChanged = true;
        settingsChanged = settingsChanged || didChange;

        logger.info(`[Settings] Applied migration ${migration.id} (${migration.mode}).`);
    }

    if (settingsChanged) {
        for (const [key, value] of Object.entries(nextSettings)) {
            targetStore.set(key, value);
        }
    }

    if (migrationsChanged) {
        targetStore.set(SETTINGS_MIGRATIONS_KEY, Array.from(appliedMigrations));
    }
}

function sanitizeSettings(storeData) {
    const settings = { ...storeData };
    delete settings[SETTINGS_MIGRATIONS_KEY];
    return settings;
}

function getEncryptionKey() {
    try {
        const keyPath = path.join(app.getPath('userData'), '.koe-key');

        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8');
        }

        const newKey = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(keyPath, newKey, { mode: 0o600 });

        return newKey;
    } catch (error) {
        logger.error('Failed to manage encryption key:', error);
        return crypto.randomBytes(32).toString('hex');
    }
}

function createStore() {
    const createdStore = new Store({
        defaults: DEFAULT_SETTINGS,
        encryptionKey: getEncryptionKey()
    });

    createdStore.store;
    applySettingsMigrations(createdStore);
    return createdStore;
}

/**
 * Initialize the store lazily.
 * This ensures app is ready before we try to use app.getPath().
 */
function initStore() {
    if (store) return store;

    try {
        store = createStore();
    } catch (error) {
        logger.warn('Settings store corrupted or encryption key changed, resetting to defaults:', error.message);

        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            if (fs.existsSync(configPath)) {
                fs.unlinkSync(configPath);
                logger.info('Deleted corrupt config file:', configPath);
            }
        } catch (deleteErr) {
            logger.error('Failed to delete corrupt config:', deleteErr);
        }

        store = createStore();
    }

    return store;
}

function getSettings() {
    const s = initStore();
    return sanitizeSettings(s.store);
}

function getSetting(key) {
    const s = initStore();
    return s.get(key);
}

function setSettings(newSettings) {
    const s = initStore();
    s.store = { ...s.store, ...newSettings };
}

function setSetting(key, value) {
    const s = initStore();
    s.set(key, value);
}

module.exports = {
    getSettings,
    getSetting,
    setSettings,
    setSetting,
    getEncryptionKey,
    get store() { return initStore(); }
};
