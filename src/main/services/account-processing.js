const { randomBytes, randomUUID } = require('crypto');
const http = require('http');
const https = require('https');

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

function handleNdjsonMessage(message, onStage) {
    if (message.type === 'status' && typeof onStage === 'function') {
        onStage({ stage: message.stage, label: message.label, progress: message.progress });
        return { done: false, completion: null };
    }

    if (message.type === 'empty') {
        return { done: true, completion: { rawText: '', refinedText: '', empty: true } };
    }

    if (message.type === 'complete') {
        return {
            done: false,
            completion: {
                rawText: String(message.rawText || '').trim(),
                refinedText: String(message.refinedText || '').trim() || String(message.rawText || '').trim(),
                empty: Boolean(message.empty)
            }
        };
    }

    if (message.type === 'error') {
        throw createApiError(
            message.error?.code || 'PROCESSING_FAILED',
            message.error?.message || 'Account processing failed.',
            message.error?.retryable === true,
            400
        );
    }

    return { done: false, completion: null };
}

function parseNdjsonText(text, onStage) {
    let completion = null;
    for (const rawLine of String(text || '').split('\n')) {
        const line = rawLine.trim();
        if (!line) {
            continue;
        }

        let message;
        try {
            message = JSON.parse(line);
        } catch (_error) {
            throw createApiError('BAD_RESPONSE', 'Account processing returned malformed status output.');
        }

        const result = handleNdjsonMessage(message, onStage);
        if (result.completion) {
            completion = result.completion;
        }
        if (result.done) {
            return result.completion;
        }
    }

    if (completion) {
        return completion;
    }

    throw createApiError('BAD_RESPONSE', 'Account processing ended before returning a result.');
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

                const result = handleNdjsonMessage(message, onStage);
                if (result.completion) {
                    completion = result.completion;
                }
                if (result.done) {
                    return result.completion;
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

function appendMultipartField(parts, boundary, key, value) {
    if (value === undefined || value === null || value === '') {
        return;
    }

    parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
        `${String(value)}\r\n`
    ));
}

function buildProcessingMultipart(taskItem) {
    const boundary = `----koe-desktop-${randomBytes(12).toString('hex')}`;
    const parts = [];

    appendMultipartField(parts, boundary, 'requestId', taskItem.requestId || randomUUID());
    appendMultipartField(parts, boundary, 'clientSessionId', taskItem.clientSessionId || taskItem.sessionId || null);
    appendMultipartField(parts, boundary, 'language', taskItem.language || 'auto');
    appendMultipartField(parts, boundary, 'model', taskItem.model || 'whisper-large-v3-turbo');
    appendMultipartField(parts, boundary, 'promptStyle', taskItem.promptStyle || 'Clean');
    appendMultipartField(parts, boundary, 'enhanceText', String(taskItem.enhanceText !== false));
    appendMultipartField(parts, boundary, 'audioSeconds', String(Math.max(0, Number(taskItem.audioSeconds || 0) || 0)));
    appendMultipartField(parts, boundary, 'customPrompt', taskItem.customPrompt || '');
    appendMultipartField(parts, boundary, 'mode', taskItem.mode || '');

    const filename = sanitizeMultipartHeaderValue(taskItem.fileName, 'audio.wav');
    const contentType = sanitizeContentType(taskItem.contentType, 'audio/wav');
    parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
    ));
    parts.push(Buffer.from(taskItem.wavBuffer));
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    return {
        boundary,
        body: Buffer.concat(parts)
    };
}

function requestMultipartViaNode(urlString, headers, body) {
    return new Promise((resolve, reject) => {
        let url;
        try {
            url = new URL(urlString);
        } catch (error) {
            reject(error);
            return;
        }

        const transport = url.protocol === 'https:' ? https : http;
        const request = transport.request({
            method: 'POST',
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || undefined,
            path: `${url.pathname}${url.search}`,
            headers: {
                ...headers,
                'Content-Length': String(body.length)
            }
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            response.on('end', () => {
                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode || 0,
                    headers: {
                        get: (name) => String(response.headers[String(name).toLowerCase()] || '')
                    },
                    text: async () => Buffer.concat(chunks).toString('utf8'),
                    json: async () => JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null')
                });
            });
        });

        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

async function processViaAuthenticatedBackend(taskItem, processingContext) {
    if (!processingContext?.sessionToken || !processingContext?.apiBaseUrl) {
        throw createApiError('INVALID_SESSION', 'You are signed out. Please sign in again.', false, 401);
    }

    const multipart = buildProcessingMultipart(taskItem);
    const requestUrl = `${processingContext.apiBaseUrl}/process/`;
    let response;
    try {
        response = await requestMultipartViaNode(requestUrl, buildProcessingHeaders(processingContext, {
            Accept: 'application/x-ndjson',
            'Content-Type': `multipart/form-data; boundary=${multipart.boundary}`
        }), multipart.body);
    } catch (error) {
        const detail = error?.cause?.message || error?.message || 'Network error';
        throw createApiError('NETWORK_ERROR', `Could not reach account processing backend: ${detail}`, true, 0);
    }

    if (!response.ok) {
        throw await parseResponseError(response, 'Account processing failed.');
    }

    return parseNdjsonText(await response.text(), taskItem.onStage);
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
