const { parentPort } = require('worker_threads');
const {
    GROQ_WHISPER_URL,
    GROQ_CHAT_URL,
    DEFAULT_WHISPER_MODEL: DEFAULT_MODEL,
    DEFAULT_ENHANCE_MODEL: ENHANCE_MODEL,
    REFINEMENT_GUARDRAILS,
    parseErrorMessage,
    sanitizeRefinedText,
    resolveEnhancementPrompt
} = require('@koe/core');
const REQUESTS_PER_MINUTE = 20;

let requestTimestamps = [];

function postMessage(type, payload = {}) {
    parentPort.postMessage({ type, ...payload });
}

function cleanOldTimestamps() {
    const cutoff = Date.now() - 60_000;
    requestTimestamps = requestTimestamps.filter((timestamp) => timestamp > cutoff);
}

async function waitForRequestSlot() {
    while (true) {
        cleanOldTimestamps();
        if (requestTimestamps.length < REQUESTS_PER_MINUTE) {
            requestTimestamps.push(Date.now());
            return;
        }

        const waitTime = Math.max((requestTimestamps[0] + 60_000) - Date.now(), 250);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
}

function toUint8Array(input) {
    if (!input) {
        return new Uint8Array();
    }

    if (input instanceof Uint8Array) {
        return input;
    }

    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }

    if (ArrayBuffer.isView(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    if (Buffer.isBuffer(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    throw new Error('Unsupported audio payload.');
}

async function transcribeAudio(buffer, options) {
    const apiKey = String(options.groqApiKey || '').trim();
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const fileBytes = toUint8Array(buffer);
    let retries = 1;

    while (retries >= 0) {
        try {
            const formData = new FormData();
            formData.append('file', new Blob([fileBytes], { type: 'audio/wav' }), 'audio.wav');
            formData.append('model', options.model || DEFAULT_MODEL);

            if (options.language && options.language !== 'auto') {
                formData.append('language', options.language);
            }

            await waitForRequestSlot();
            postMessage('usage-recorded', {
                requestKind: 'transcription',
                audioSeconds: Number(options.audioSeconds || 0)
            });

            const response = await fetch(GROQ_WHISPER_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`
                },
                body: formData
            });

            if (response.status === 401) {
                throw new Error('Invalid Groq API Key. Please verify your credentials in settings.');
            }

            if (response.status === 429) {
                throw new Error('Rate limit exceeded (429).');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${parseErrorMessage(errorData, response.statusText)}`);
            }

            const data = await response.json();
            const transcriptText = String(data.text || '').trim();

            if (!transcriptText || transcriptText.toLowerCase().includes('thanks for watching')) {
                return '';
            }

            return transcriptText;
        } catch (error) {
            if (error.message.includes('Rate limit') || error.message.includes('Invalid API Key') || retries === 0) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries -= 1;
        }
    }

    return '';
}

async function refineText(rawText, options) {
    const apiKey = String(options.groqApiKey || '').trim();
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const sourceText = String(rawText || '').trim();
    if (!sourceText) {
        return '';
    }

    const stylePrompt = resolveEnhancementPrompt(options.promptStyle || 'Clean', options.customPrompt || '');
    const systemPrompt = `${REFINEMENT_GUARDRAILS} ${stylePrompt} Before you finish, check the final text and remove any transcript tags if any remain.`.trim();

    await waitForRequestSlot();
    postMessage('usage-recorded', {
        requestKind: 'refinement',
        audioSeconds: 0
    });

    const response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: ENHANCE_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Refine only the text inside <transcript> tags.\n<transcript>\n${sourceText}\n</transcript>`
                }
            ],
            temperature: 0.2,
            max_completion_tokens: 2048
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Refinement failed: ${response.status} - ${parseErrorMessage(errorData, response.statusText)}`);
    }

    const data = await response.json();
    return sanitizeRefinedText(data.choices?.[0]?.message?.content) || sourceText;
}

async function processSegment(payload) {
    const rawText = await transcribeAudio(payload.buffer, payload.options);

    postMessage('segment-result', {
        sessionId: payload.sessionId,
        segmentId: payload.segmentId,
        sequence: payload.sequence,
        audioSeconds: payload.audioSeconds,
        empty: !rawText,
        rawText
    });
}

async function processSessionRefinement(payload) {
    const refinedText = await refineText(payload.rawText, payload.options);
    postMessage('session-refined', {
        sessionId: payload.sessionId,
        refinedText
    });
}

parentPort.on('message', (message) => {
    if (!message || !message.type) {
        return;
    }

    if (message.type === 'process-segment') {
        processSegment(message.payload).catch((error) => {
            postMessage('segment-error', {
                sessionId: message.payload.sessionId,
                segmentId: message.payload.segmentId,
                sequence: message.payload.sequence,
                audioSeconds: message.payload.audioSeconds,
                error: error.message || 'Segment processing failed.'
            });
        });
        return;
    }

    if (message.type === 'refine-session') {
        processSessionRefinement(message.payload).catch((error) => {
            postMessage('session-refine-error', {
                sessionId: message.payload.sessionId,
                error: error.message || 'Session refinement failed.'
            });
        });
    }
});
