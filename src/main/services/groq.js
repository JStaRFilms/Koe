const { 
    REFINEMENT_GUARDRAILS, 
    sanitizeRefinedText, 
    resolveEnhancementPrompt, 
    parseErrorMessage,
    GROQ_WHISPER_URL,
    GROQ_CHAT_URL,
    PROD_PROXY_URL,
    DEFAULT_WHISPER_MODEL: DEFAULT_MODEL,
    DEFAULT_ENHANCE_MODEL: ENHANCE_MODEL
} = require('@koe/core');

const { getSetting, getSettings } = require('./settings');
const rateLimiter = require('./rate-limiter');
const logger = require('./logger');

// Helpers moved to @koe/core

function resolveProcessingEndpoint(settings = getSettings()) {
    const envUrl = String(process.env.KOE_PROCESSING_URL || '').trim();
    if (envUrl) {
        return envUrl;
    }

    const configuredUrl = String(settings.cloudProcessingUrl || '').trim();
    if (configuredUrl) {
        return configuredUrl;
    }

    return PROD_PROXY_URL;
}

function shouldUseCloudProcessing(settings = getSettings()) {
    return Boolean(settings.cloudProcessingEnabled && resolveProcessingEndpoint(settings));
}

function emitStage(onStage, stage, label, progress) {
    if (typeof onStage === 'function') {
        onStage({ stage, label, progress });
    }
}

// parseErrorMessage moved to @koe/core

async function parseProxyStream(response, onStage) {
    if (!response.body) {
        throw new Error('Cloud processing response did not include a body.');
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
                } catch (error) {
                    throw new Error('Cloud processing returned malformed status output.');
                }

                if (message.type === 'status') {
                    emitStage(onStage, message.stage, message.label, message.progress);
                } else if (message.type === 'empty') {
                    return { rawText: '', refinedText: '', empty: true };
                } else if (message.type === 'complete') {
                    completion = {
                        rawText: String(message.rawText || '').trim(),
                        refinedText: String(message.refinedText || '').trim() || String(message.rawText || '').trim()
                    };
                } else if (message.type === 'error') {
                    throw new Error(message.error || 'Cloud processing failed.');
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

    throw new Error('Cloud processing ended before returning a result.');
}

async function transcribeDirect(wavBuffer, language = 'auto', model = getSetting('model') || DEFAULT_MODEL) {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', model);

    if (language && language !== 'auto') {
        formData.append('language', language);
    }

    let retries = 1;

    while (retries >= 0) {
        try {
            const response = await fetch(GROQ_WHISPER_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`
                },
                body: formData
            });

            if (response.status === 401) {
                throw new Error('Invalid Groq API Key. Please verify your credentials in settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded (429).');
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${parseErrorMessage(errorData, response.statusText)}`);
            }

            const data = await response.json();
            const transcriptText = data.text?.trim() || '';

            if (!transcriptText || transcriptText.toLowerCase().includes('thanks for watching')) {
                return '';
            }

            return transcriptText;
        } catch (error) {
            if (error.message.includes('Rate limit') || error.message.includes('Invalid API Key') || retries === 0) {
                throw error;
            }

            logger.warn(`[Groq] Network error, retrying... (${error.message})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries -= 1;
        }
    }

    return '';
}

async function enhance(rawText, promptStyle = 'Clean', customPromptOverride = null) {
    const settings = getSettings();
    const apiKey = settings.groqApiKey;
    if (!apiKey) return rawText;

    const customPrompt = typeof customPromptOverride === 'string'
        ? customPromptOverride
        : (settings.customPrompt || '');
    const stylePrompt = resolveEnhancementPrompt(promptStyle, customPrompt);
    const systemPrompt = `${REFINEMENT_GUARDRAILS} ${stylePrompt} Before you finish, check the final text and remove any transcript tags if any remain.`.trim();
    const sourceText = String(rawText || '').trim();

    if (!sourceText) {
        return '';
    }

    try {
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
            logger.warn('[Enhance] API error', response.status);
            return rawText;
        }

        const data = await response.json();
        return sanitizeRefinedText(data.choices?.[0]?.message?.content);
    } catch (error) {
        logger.warn('[Enhance] Network error', error.message);
        return rawText;
    }
}

async function processDirectPipeline(taskItem) {
    emitStage(taskItem.onStage, 'transcribing', 'Transcribing', 58);
    const rawText = await transcribeDirect(taskItem.wavBuffer, taskItem.language, taskItem.model);

    if (!rawText) {
        return { rawText: '', refinedText: '', empty: true };
    }

    let refinedText = rawText;
    if (taskItem.enhanceText) {
        emitStage(taskItem.onStage, 'refining', 'Refining', 86);
        refinedText = await enhance(rawText, taskItem.promptStyle, taskItem.customPrompt);
    }

    return { rawText, refinedText: refinedText || rawText };
}

async function processViaProxy(taskItem, settings) {
    const endpoint = resolveProcessingEndpoint(settings);
    if (!endpoint) {
        throw new Error('Cloud processing URL is not configured.');
    }

    const apiKey = String(settings.groqApiKey || '').trim();
    if (!apiKey) {
        throw new Error('Groq API Key is required for cloud processing. Please add it in settings.');
    }

    const formData = new FormData();
    const blob = new Blob([taskItem.wavBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'audio.wav');
    formData.append('language', taskItem.language || 'auto');
    formData.append('model', taskItem.model || settings.model || DEFAULT_MODEL);
    formData.append('promptStyle', taskItem.promptStyle || 'Clean');
    formData.append('enhanceText', String(taskItem.enhanceText !== false));

    if (taskItem.customPrompt) {
        formData.append('customPrompt', taskItem.customPrompt);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/x-ndjson',
            Authorization: `Bearer ${apiKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(parseErrorMessage(payload, `Cloud processing failed (${response.status}).`));
        }

        const text = await response.text().catch(() => '');
        throw new Error(text.trim() || `Cloud processing failed (${response.status}).`);
    }

    return parseProxyStream(response, taskItem.onStage);
}

async function processTask(taskItem) {
    const settings = getSettings();

    if (shouldUseCloudProcessing(settings)) {
        try {
            return await processViaProxy(taskItem, settings);
        } catch (error) {
            if (!settings.groqApiKey) {
                throw error;
            }

            logger.warn(`[Cloud Pipeline] Falling back to direct Groq processing: ${error.message}`);
        }
    }

    return processDirectPipeline(taskItem);
}

async function processAudio(wavBuffer, audioSeconds = 0, options = {}) {
    const settings = getSettings();
    const item = {
        wavBuffer,
        audioSeconds,
        language: options.language || settings.language || 'auto',
        enhanceText: options.enhanceText ?? (settings.enhanceText !== false),
        promptStyle: options.promptStyle || settings.promptStyle || 'Clean',
        customPrompt: options.customPrompt ?? (settings.customPrompt || ''),
        model: options.model || settings.model || DEFAULT_MODEL,
        onStage: typeof options.onStage === 'function' ? options.onStage : null
    };

    return rateLimiter.enqueue(item, processTask);
}

async function transcribe(wavBuffer, audioSeconds = 0, language = 'auto') {
    const result = await processAudio(wavBuffer, audioSeconds, {
        language,
        enhanceText: false
    });

    return result.rawText || '';
}

async function validateApiKey(apiKey) {
    if (!apiKey) return false;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

module.exports = {
    processAudio,
    transcribe,
    transcribeDirect,
    enhance,
    validateApiKey,
    resolveProcessingEndpoint,
    shouldUseCloudProcessing
};
