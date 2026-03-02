const Store = require('electron-store').default || require('electron-store');
const { DEFAULT_SETTINGS } = require('../../shared/constants');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Generate or retrieve a unique encryption key for this installation
function getEncryptionKey() {
    // Store the key in userData directory, outside of the encrypted store itself
    const keyPath = path.join(app.getPath('userData'), '.koe-key');

    try {
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
        console.error('Failed to manage encryption key:', error);
        // Fallback: generate a temporary key for this session only
        // This is not ideal but prevents the app from crashing
        return crypto.randomBytes(32).toString('hex');
    }
}

const store = new Store({
    defaults: DEFAULT_SETTINGS,
    encryptionKey: getEncryptionKey()
});

function getSettings() {
    return store.store;
}

function getSetting(key) {
    return store.get(key);
}

function setSettings(newSettings) {
    store.store = { ...store.store, ...newSettings };
}

function setSetting(key, value) {
    store.set(key, value);
}

module.exports = {
    getSettings,
    getSetting,
    setSettings,
    setSetting,
    store
};
