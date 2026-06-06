const Store = require('electron-store').default || require('electron-store');
const { v4: uuidv4 } = require('uuid');
const { getEncryptionKey } = require('./settings');

let accountStore = null;

function getStore() {
    if (!accountStore) {
        accountStore = new Store({
            name: 'account-session',
            encryptionKey: getEncryptionKey()
        });
    }

    return accountStore;
}

function isExpired(expiresAt) {
    if (!expiresAt) {
        return false;
    }

    const expiresAtMs = Date.parse(expiresAt);
    return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
}

function clearSession() {
    const store = getStore();
    store.delete('sessionToken');
    store.delete('sessionExpiresAt');
    store.delete('sessionUser');
    store.delete('sessionDevice');
    store.delete('lastSnapshot');
}

function getInstallationId() {
    const store = getStore();
    const existing = String(store.get('installationId') || '').trim();
    if (existing) {
        return existing;
    }

    const created = uuidv4();
    store.set('installationId', created);
    return created;
}

function setSession(session = {}) {
    const store = getStore();
    store.set('sessionToken', String(session.token || '').trim());
    store.set('sessionExpiresAt', session.expiresAt || null);
    store.set('sessionUser', session.user || null);
    store.set('sessionDevice', session.device || null);
}

function getSessionToken() {
    const session = getSessionRecord();
    return session?.token || null;
}

function getSessionRecord() {
    const store = getStore();
    const token = String(store.get('sessionToken') || '').trim();
    const expiresAt = store.get('sessionExpiresAt') || null;

    if (!token) {
        return null;
    }

    if (isExpired(expiresAt)) {
        clearSession();
        return null;
    }

    return {
        token,
        expiresAt,
        user: store.get('sessionUser') || null,
        device: store.get('sessionDevice') || null,
        installationId: getInstallationId(),
        lastSnapshot: store.get('lastSnapshot') || null
    };
}

function updateSessionMetadata(next = {}) {
    const store = getStore();

    if (Object.prototype.hasOwnProperty.call(next, 'expiresAt')) {
        store.set('sessionExpiresAt', next.expiresAt || null);
    }

    if (Object.prototype.hasOwnProperty.call(next, 'user')) {
        store.set('sessionUser', next.user || null);
    }

    if (Object.prototype.hasOwnProperty.call(next, 'device')) {
        store.set('sessionDevice', next.device || null);
    }
}

function setLastSnapshot(snapshot) {
    getStore().set('lastSnapshot', snapshot || null);
}

function getPublicSessionState() {
    const session = getSessionRecord();
    if (!session) {
        return {
            authenticated: false,
            session: null,
            user: null,
            device: null,
            installationId: getInstallationId(),
            lastSnapshot: null
        };
    }

    return {
        authenticated: true,
        session: { expiresAt: session.expiresAt },
        user: session.user || null,
        device: session.device || null,
        installationId: session.installationId,
        lastSnapshot: session.lastSnapshot || null
    };
}

module.exports = {
    clearSession,
    getInstallationId,
    getPublicSessionState,
    getSessionRecord,
    getSessionToken,
    setLastSnapshot,
    setSession,
    updateSessionMetadata
};
