const { randomBytes, randomUUID } = require('crypto');

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

function sanitizeMultipartHeaderValue(value, fallback) {
    const normalized = String(value || '').replace(/[\r\n"\\]/g, '_').slice(0, 160);
    return normalized || fallback;
}

function sanitizeContentType(value, fallback = 'application/octet-stream') {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(normalized) ? normalized : fallback;
}

function buildMultipartBody(fields, file) {
    const boundary = `----koe-desktop-${randomBytes(12).toString('hex')}`;
    const parts = [];

    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }

        parts.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
            `${String(value)}\r\n`
        ));
    }

    const fieldName = sanitizeMultipartHeaderValue(file.fieldName, 'audio');
    const filename = sanitizeMultipartHeaderValue(file.filename, 'audio.wav');
    const contentType = sanitizeContentType(file.contentType, 'audio/wav');

    parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
    ));
    parts.push(Buffer.from(file.bytes));
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    return {
        boundary,
        body: Buffer.concat(parts)
    };
}

async function processViaAuthenticatedBackend(taskItem, processingContext) {
    if (!processingContext?.sessionToken || !processingContext?.apiBaseUrl) {
        throw createApiError('INVALID_SESSION', 'You are signed out. Please sign in again.', false, 401);
    }

    const multipart = buildMultipartBody({
        requestId: taskItem.requestId || randomUUID(),
        clientSessionId: taskItem.clientSessionId || taskItem.sessionId || null,
        language: taskItem.language || 'auto',
        model: taskItem.model || 'whisper-large-v3-turbo',
        promptStyle: taskItem.promptStyle || 'Clean',
        enhanceText: String(taskItem.enhanceText !== false),
        audioSeconds: String(Math.max(0, Number(taskItem.audioSeconds || 0) || 0)),
        customPrompt: taskItem.customPrompt || '',
        mode: taskItem.mode || ''
    }, {
        fieldName: 'audio',
        filename: taskItem.fileName || 'audio.wav',
        contentType: taskItem.contentType || 'audio/wav',
        bytes: taskItem.wavBuffer
    });

    let response;
    try {
        response = await fetch(`${processingContext.apiBaseUrl}/process`, {
            method: 'POST',
            headers: buildProcessingHeaders(processingContext, {
                Accept: 'application/x-ndjson',
                'Content-Type': `multipart/form-data; boundary=${multipart.boundary}`
            }),
            body: new Blob([multipart.body], { type: `multipart/form-data; boundary=${multipart.boundary}` })
        });
    } catch (error) {
        throw createApiError('NETWORK_ERROR', `Could not reach account processing backend: ${error.message || 'Network error'}`, true, 0);
    }

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
            ...(options.clientSessionId || options.sessionId ? { clientSessionId: String(options.clientSessionId || options.sessionId) } : {}),
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
