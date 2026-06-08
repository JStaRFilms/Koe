const { 
    REFINEMENT_GUARDRAILS, 
    sanitizeRefinedText, 
    resolveEnhancementPrompt, 
    parseErrorMessage,
    GROQ_WHISPER_URL,
    GROQ_CHAT_URL,
    DEFAULT_WHISPER_MODEL: DEFAULT_MODEL,
    DEFAULT_ENHANCE_MODEL: ENHANCE_MODEL
} = require('@koe/core');

const { getSetting, getSettings } = require('./settings');
const accountClient = require('./account-client');
const { processViaAuthenticatedBackend, refineViaAuthenticatedBackend } = require('./account-processing');
const rateLimiter = require('./rate-limiter');
const logger = require('./logger');

// Helpers moved to @koe/core

function emitStage(onStage, stage, label, progress) {
    if (typeof onStage === 'function') {
        onStage({ stage, label, progress });
    }
}

// parseErrorMessage moved to @koe/core

async function transcribeDirect(wavBuffer, language = 'auto', model = getSetting('model') || DEFAULT_MODEL, fileOptions = {}) {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: fileOptions.contentType || 'audio/wav' });
    formData.append('file', blob, fileOptions.fileName || 'audio.wav');
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
    const accountProcessing = accountClient.getProcessingContext();
    const sourceText = String(rawText || '').trim();

    if (!sourceText) {
        return '';
    }

    const customPrompt = typeof customPromptOverride === 'string'
        ? customPromptOverride
        : (settings.customPrompt || '');

    if (accountProcessing) {
        try {
            return await refineViaAuthenticatedBackend(sourceText, {
                promptStyle,
                customPrompt
            }, accountProcessing);
        } catch (error) {
            if (error.code === 'INVALID_SESSION') {
                accountClient.clearSession();
            }

            logger.warn(`[Enhance] Account refinement failed: ${error.message}`);
            return rawText;
        }
    }

    const apiKey = settings.groqApiKey;
    if (!apiKey) {
        return rawText;
    }

    const stylePrompt = resolveEnhancementPrompt(promptStyle, customPrompt);
    const systemPrompt = `${REFINEMENT_GUARDRAILS} ${stylePrompt}`.trim();

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
    const rawText = await transcribeDirect(taskItem.wavBuffer, taskItem.language, taskItem.model, {
        fileName: taskItem.fileName,
        contentType: taskItem.contentType
    });

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

async function processTask(taskItem) {
    const settings = getSettings();
    const accountProcessing = taskItem.accountProcessing || accountClient.getProcessingContext();

    if (accountProcessing) {
        try {
            return await processViaAuthenticatedBackend(taskItem, accountProcessing);
        } catch (error) {
            if (error.code === 'INVALID_SESSION') {
                accountClient.clearSession();
            }
            throw error;
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
        onStage: typeof options.onStage === 'function' ? options.onStage : null,
        accountProcessing: options.accountProcessing || accountClient.getProcessingContext(),
        requestId: options.requestId,
        clientSessionId: options.clientSessionId,
        sessionId: options.sessionId,
        mode: options.mode,
        fileName: options.fileName || 'audio.wav',
        contentType: options.contentType || 'audio/wav'
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
    validateApiKey
};
