const Store = require('electron-store');
const { DEFAULT_SETTINGS } = require('../../shared/constants');

const store = new Store({
    defaults: DEFAULT_SETTINGS,
    encryptionKey: 'koe-super-secret-key-replace-in-prod' // Ensure valid encryption token for store
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
