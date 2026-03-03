const Store = require('electron-store').default || require('electron-store');
const { DEFAULT_SETTINGS } = require('../../shared/constants');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('./logger');

let store = null;

/**
 * Initialize the store lazily - called on first use
 * This ensures app is ready before we try to use app.getPath()
 */
function initStore() {
    if (store) return store;

    // Generate or retrieve a unique encryption key for this installation
    function getEncryptionKey() {
        try {
            // Store the key in userData directory, outside of the encrypted store itself
            const keyPath = path.join(app.getPath('userData'), '.koe-key');

            // Check if key already exists
            if (fs.existsSync(keyPath)) {
                return fs.readFileSync(keyPath, 'utf8');
            }

            // Generate a new 256-bit key (32 bytes = 64 hex characters)
            const newKey = crypto.randomBytes(32).toString('hex');

            // Write key to file with restricted permissions (Windows doesn't support mode, but Linux/Mac do)
            fs.writeFileSync(keyPath, newKey, { mode: 0o600 });

            return newKey;
        } catch (error) {
            logger.error('Failed to manage encryption key:', error);
            // Fallback: generate a temporary key for this session only
            return crypto.randomBytes(32).toString('hex');
        }
    }

    try {
        store = new Store({
            defaults: DEFAULT_SETTINGS,
            encryptionKey: getEncryptionKey()
        });
        // Trigger a read to surface any deserialization errors immediately
        store.store;
    } catch (error) {
        logger.warn('Settings store corrupted or encryption key changed, resetting to defaults:', error.message);
        // The config file exists but can't be decrypted — delete it and start fresh
        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            if (fs.existsSync(configPath)) {
                fs.unlinkSync(configPath);
                logger.info('Deleted corrupt config file:', configPath);
            }
        } catch (deleteErr) {
            logger.error('Failed to delete corrupt config:', deleteErr);
        }
        // Create a fresh store
        store = new Store({
            defaults: DEFAULT_SETTINGS,
            encryptionKey: getEncryptionKey()
        });
    }

    return store;
}

function getSettings() {
    const s = initStore();
    return s.store;
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
    get store() { return initStore(); }
};
