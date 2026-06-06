const os = require('os');
const { app } = require('electron');
const { getSettings, setSettings } = require('./settings');
const accountStorage = require('./account-storage');
const logger = require('./logger');

const DEFAULT_BACKEND_ORIGIN = 'https://www.koevoice.xyz';
const LOCAL_DEV_BACKEND_API_BASE = 'http://localhost:3000/api/v1';

const SYNCED_SETTINGS_KEYS = ['language', 'promptStyle', 'customPrompt', 'enhanceText', 'model'];

function normalizeApiBase(rawValue, fallback = `${DEFAULT_BACKEND_ORIGIN}/api/v1`) {
    const raw = String(rawValue || '').trim();
    if (!raw) {
        return fallback;
    }

    try {
        const url = new URL(raw);
        if (url.pathname.startsWith('/api/v1')) {
            return `${url.origin}/api/v1`;
        }
        return `${url.origin}/api/v1`;
    } catch (_error) {
        return fallback;
    }
}

function resolveBackendApiBase(settings = getSettings()) {
    const configured = process.env.KOE_BACKEND_URL
        || settings.accountApiUrl;

    if (configured) {
        return normalizeApiBase(configured);
    }

    if (app && app.isPackaged === false) {
        return LOCAL_DEV_BACKEND_API_BASE;
    }

    return normalizeApiBase(DEFAULT_BACKEND_ORIGIN);
}

function buildDeviceLabel() {
    const host = String(os.hostname() || '').trim();
    if (host) {
        return host;
    }

    return 'Desktop';
}

function getDeviceMetadata() {
    return {
        platform: 'desktop',
        installationId: accountStorage.getInstallationId(),
        deviceLabel: buildDeviceLabel(),
        appVersion: typeof app.getVersion === 'function' ? app.getVersion() : '',
        osVersion: `${os.platform()} ${os.release()}`.trim()
    };
}

async function parseApiError(response, fallbackMessage, requestUrl = '') {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    let payload = null;

    if (contentType.includes('application/json')) {
        payload = await response.json().catch(() => null);
    } else {
        await response.text().catch(() => '');
    }

    const isHtmlResponse = contentType.includes('text/html');
    const routeHint = requestUrl
        ? ` Account backend URL: ${requestUrl}`
        : '';
    const message = payload?.error?.message
        || (isHtmlResponse
            ? `Account backend returned a web page instead of API JSON.${routeHint} Check that the local website backend is running and that KOE_BACKEND_URL points to /api/v1.`
            : null)
        || fallbackMessage
        || `Request failed (${response.status}).`;
    const error = new Error(message);
    error.code = payload?.error?.code || `HTTP_${response.status}`;
    error.status = response.status;
    error.retryable = payload?.error?.retryable === true;
    return error;
}

function applySyncedSettings(settings) {
    if (!settings || typeof settings !== 'object') {
        return;
    }

    const nextSettings = {};
    for (const key of SYNCED_SETTINGS_KEYS) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            nextSettings[key] = settings[key];
        }
    }

    if (Object.keys(nextSettings).length > 0) {
        setSettings(nextSettings);
    }
}

function buildSignedOutState(extra = {}) {
    const localSettings = getSettings();
    const stored = accountStorage.getPublicSessionState();

    return {
        authenticated: false,
        user: null,
        session: null,
        device: null,
        resolvedMode: null,
        capabilities: null,
        settings: null,
        recentHistory: [],
        policy: null,
        installationId: stored.installationId,
        localFallback: {
            available: Boolean(String(localSettings.groqApiKey || '').trim()),
            hasLocalGroqKey: Boolean(String(localSettings.groqApiKey || '').trim())
        },
        ...extra
    };
}

function createTimeoutError(url, timeoutMs) {
    const error = new Error(`Account backend did not respond within ${Math.round(timeoutMs / 1000)}s. Make sure the website backend is running, then try again. Backend: ${url}`);
    error.code = 'BACKEND_TIMEOUT';
    error.status = 0;
    error.retryable = true;
    return error;
}

function createNetworkError(error, url) {
    const message = error?.name === 'AbortError'
        ? `Account backend request was cancelled. Backend: ${url}`
        : `Could not reach the account backend. Make sure the website backend is running, then try again. Backend: ${url}`;
    const nextError = new Error(message);
    nextError.code = error?.name === 'AbortError' ? 'BACKEND_TIMEOUT' : 'BACKEND_UNREACHABLE';
    nextError.status = 0;
    nextError.retryable = true;
    return nextError;
}

async function requestJson(path, options = {}) {
    const settings = getSettings();
    const session = accountStorage.getSessionRecord();
    const url = `${resolveBackendApiBase(settings)}${path}`;
    const headers = {
        Accept: 'application/json',
        'X-Koe-Client': 'desktop',
        'X-Koe-App-Version': typeof app.getVersion === 'function' ? app.getVersion() : '',
        ...(options.headers || {})
    };

    if (options.auth !== false) {
        if (!session?.token) {
            const error = new Error('You are signed out.');
            error.code = 'INVALID_SESSION';
            error.status = 401;
            throw error;
        }

        headers.Authorization = `Bearer ${session.token}`;
        if (session.device?.id) {
            headers['X-Koe-Device-Id'] = session.device.id;
        }
    }

    let body = options.body;
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
    }

    const timeoutMs = Number(options.timeoutMs || 20_000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(createTimeoutError(url, timeoutMs)), timeoutMs);
    let response;

    try {
        response = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body,
            signal: controller.signal
        });
    } catch (error) {
        if (error?.code === 'BACKEND_TIMEOUT') {
            throw error;
        }
        throw createNetworkError(error, url);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const error = await parseApiError(response, options.fallbackMessage, url);
        if (error.code === 'INVALID_SESSION' || error.status === 401) {
            accountStorage.clearSession();
        }
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function fetchAccountSnapshot() {
    const [sessionState, snapshot] = await Promise.all([
        requestJson('/auth/session'),
        requestJson('/account/snapshot')
    ]);

    accountStorage.updateSessionMetadata({
        expiresAt: sessionState?.session?.expiresAt || null,
        user: sessionState?.user || snapshot?.user || null,
        device: sessionState?.device || null
    });
    accountStorage.setLastSnapshot(snapshot || null);
    applySyncedSettings(snapshot?.settings || null);

    return {
        authenticated: true,
        user: snapshot?.user || sessionState?.user || null,
        session: sessionState?.session || null,
        device: sessionState?.device || null,
        resolvedMode: snapshot?.resolvedMode || null,
        capabilities: snapshot?.capabilities || null,
        settings: snapshot?.settings || null,
        recentHistory: snapshot?.recentHistory || [],
        policy: snapshot?.policy || null,
        installationId: accountStorage.getInstallationId(),
        localFallback: buildSignedOutState().localFallback
    };
}

async function getAccountState() {
    const stored = accountStorage.getSessionRecord();
    if (!stored?.token) {
        return buildSignedOutState();
    }

    try {
        return await fetchAccountSnapshot();
    } catch (error) {
        if (error.code === 'INVALID_SESSION' || error.status === 401) {
            return buildSignedOutState({ error: { code: error.code, message: error.message } });
        }
        throw error;
    }
}

async function authenticate(path, body) {
    const response = await requestJson(path, {
        auth: false,
        method: 'POST',
        body: {
            ...body,
            ...getDeviceMetadata()
        },
        fallbackMessage: 'Authentication failed.'
    });

    accountStorage.setSession({
        token: response?.session?.token || '',
        expiresAt: response?.session?.expiresAt || null,
        user: response?.user || null,
        device: response?.device || null
    });

    return getAccountState();
}

async function signUp({ email, password, displayName }) {
    return authenticate('/auth/signup', {
        email,
        password,
        ...(displayName ? { displayName } : {})
    });
}

async function signIn({ email, password }) {
    return authenticate('/auth/signin', { email, password });
}

async function signOut() {
    try {
        await requestJson('/auth/signout', {
            method: 'POST',
            fallbackMessage: 'Sign out failed.'
        });
    } catch (error) {
        if (error.code !== 'INVALID_SESSION' && error.status !== 401) {
            throw error;
        }
    } finally {
        accountStorage.clearSession();
    }

    return buildSignedOutState();
}

async function requestPasswordReset(email) {
    const trimmedEmail = String(email || '').trim();
    if (!trimmedEmail) {
        const error = new Error('Enter your email address first.');
        error.code = 'BAD_REQUEST';
        error.status = 400;
        throw error;
    }

    await requestJson('/auth/request-password-reset', {
        auth: false,
        method: 'POST',
        body: { email: trimmedEmail },
        fallbackMessage: 'Could not request a password reset email.'
    });

    return { ok: true };
}

async function requestEmailVerification() {
    await requestJson('/auth/request-email-verification', {
        method: 'POST',
        fallbackMessage: 'Could not send a verification email.'
    });

    return { ok: true };
}

async function saveAccountCredential(apiKey, validate = true) {
    const response = await requestJson('/account/credentials/groq', {
        method: 'PUT',
        body: { apiKey, validate },
        fallbackMessage: 'Could not save Groq API key to your account.'
    });

    logger.info('[Account] Synced BYOK credential metadata.');
    return response;
}

async function deleteAccountCredential() {
    await requestJson('/account/credentials/groq', {
        method: 'DELETE',
        fallbackMessage: 'Could not delete the account Groq API key.'
    });

    logger.info('[Account] Deleted BYOK credential metadata.');
    return true;
}

async function setAccountMode(defaultMode) {
    const response = await requestJson('/account/mode', {
        method: 'PATCH',
        body: { defaultMode },
        fallbackMessage: 'Could not update account mode.'
    });

    const stored = accountStorage.getSessionRecord();
    if (stored?.user) {
        accountStorage.updateSessionMetadata({
            user: {
                ...stored.user,
                defaultMode: response?.defaultMode || defaultMode
            }
        });
    }

    return response;
}

async function saveAccountSettings(settings) {
    const payload = {};
    for (const key of SYNCED_SETTINGS_KEYS) {
        if (Object.prototype.hasOwnProperty.call(settings || {}, key)) {
            payload[key] = settings[key];
        }
    }

    if (Object.keys(payload).length === 0) {
        return null;
    }

    const response = await requestJson('/account/settings', {
        method: 'PATCH',
        body: payload,
        fallbackMessage: 'Could not sync account settings.'
    });

    applySyncedSettings(response?.settings || payload);
    return response;
}

function getProcessingContext() {
    const session = accountStorage.getSessionRecord();
    if (!session?.token) {
        return null;
    }

    return {
        apiBaseUrl: resolveBackendApiBase(),
        sessionToken: session.token,
        deviceId: session.device?.id || null
    };
}

function clearSession() {
    accountStorage.clearSession();
}

module.exports = {
    clearSession,
    deleteAccountCredential,
    getAccountState,
    getProcessingContext,
    requestEmailVerification,
    requestPasswordReset,
    resolveBackendApiBase,
    saveAccountCredential,
    saveAccountSettings,
    signIn,
    signOut,
    signUp,
    setAccountMode
};
