const { randomUUID } = require('crypto');

function buildProcessingHeaders(processingContext, extraHeaders = {}) {
    const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${processingContext.sessionToken}`,
        'X-Koe-Client': 'desktop',
        ...extraHeaders
    };

    if (processingContext.deviceId) {
        headers['X-Koe-Device-Id'] = processingContext.deviceId;
    }

    return headers;
}

function createApiError(code, message, retryable = false, status = 500) {
    const error = new Error(message || 'Request failed.');
    error.code = code || 'REQUEST_FAILED';
    error.retryable = retryable === true;
    error.status = status;
    return error;
}

async function parseResponseError(response, fallbackMessage) {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
        const payload = await response.json().catch(() => null);
        return createApiError(
            payload?.error?.code || `HTTP_${response.status}`,
            payload?.error?.message || fallbackMessage || `Request failed (${response.status}).`,
            payload?.error?.retryable === true,
            response.status
        );
    }

    const text = await response.text().catch(() => '');
    return createApiError(`HTTP_${response.status}`, text.trim() || fallbackMessage || `Request failed (${response.status}).`, false, response.status);
}

async function parseNdjsonStream(response, onStage) {
    if (!response.body) {
        throw createApiError('BAD_RESPONSE', 'Account processing response did not include a body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completion = null;

    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
                let message;
                try {
                    message = JSON.parse(line);
                } catch (_error) {
                    throw createApiError('BAD_RESPONSE', 'Account processing returned malformed status output.');
                }

                if (message.type === 'status' && typeof onStage === 'function') {
                    onStage({ stage: message.stage, label: message.label, progress: message.progress });
                } else if (message.type === 'empty') {
                    return { rawText: '', refinedText: '', empty: true };
                } else if (message.type === 'complete') {
                    completion = {
                        rawText: String(message.rawText || '').trim(),
                        refinedText: String(message.refinedText || '').trim() || String(message.rawText || '').trim(),
                        empty: Boolean(message.empty)
                    };
                } else if (message.type === 'error') {
                    throw createApiError(
                        message.error?.code || 'PROCESSING_FAILED',
                        message.error?.message || 'Account processing failed.',
                        message.error?.retryable === true,
                        400
                    );
                }
            }

            newlineIndex = buffer.indexOf('\n');
        }

        if (done) {
            break;
        }
    }

    if (completion) {
        return completion;
    }

    throw createApiError('BAD_RESPONSE', 'Account processing ended before returning a result.');
}

async function processViaAuthenticatedBackend(taskItem, processingContext) {
    if (!processingContext?.sessionToken || !processingContext?.apiBaseUrl) {
        throw createApiError('INVALID_SESSION', 'You are signed out. Please sign in again.', false, 401);
    }

    const formData = new FormData();
    const blob = new Blob([taskItem.wavBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'audio.wav');
    formData.append('requestId', taskItem.requestId || randomUUID());
    formData.append('clientSessionId', taskItem.clientSessionId || taskItem.sessionId || 'desktop-session');
    formData.append('language', taskItem.language || 'auto');
    formData.append('model', taskItem.model || 'whisper-large-v3-turbo');
    formData.append('promptStyle', taskItem.promptStyle || 'Clean');
    formData.append('enhanceText', String(taskItem.enhanceText !== false));
    formData.append('audioSeconds', String(Math.max(0, Number(taskItem.audioSeconds || 0) || 0)));

    if (taskItem.customPrompt) {
        formData.append('customPrompt', taskItem.customPrompt);
    }

    if (taskItem.mode) {
        formData.append('mode', taskItem.mode);
    }

    const response = await fetch(`${processingContext.apiBaseUrl}/process`, {
        method: 'POST',
        headers: buildProcessingHeaders(processingContext, {
            Accept: 'application/x-ndjson'
        }),
        body: formData
    });

    if (!response.ok) {
        throw await parseResponseError(response, 'Account processing failed.');
    }

    return parseNdjsonStream(response, taskItem.onStage);
}

async function refineViaAuthenticatedBackend(rawText, options, processingContext) {
    if (!processingContext?.sessionToken || !processingContext?.apiBaseUrl) {
        throw createApiError('INVALID_SESSION', 'You are signed out. Please sign in again.', false, 401);
    }

    const response = await fetch(`${processingContext.apiBaseUrl}/process/refine`, {
        method: 'POST',
        headers: buildProcessingHeaders(processingContext, {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            requestId: options.requestId || randomUUID(),
            clientSessionId: options.clientSessionId || options.sessionId || 'desktop-session',
            mode: options.mode || undefined,
            rawText,
            promptStyle: options.promptStyle || 'Clean',
            customPrompt: options.customPrompt || ''
        })
    });

    if (!response.ok) {
        throw await parseResponseError(response, 'Account refinement failed.');
    }

    const payload = await response.json().catch(() => null);
    return String(payload?.refinedText || rawText || '').trim();
}

module.exports = {
    createApiError,
    parseNdjsonStream,
    processViaAuthenticatedBackend,
    refineViaAuthenticatedBackend
};
