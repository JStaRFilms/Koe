const { getSetting } = require('./settings');
const rateLimiter = require('./rate-limiter');

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'whisper-large-v3-turbo';
const ENHANCE_MODEL = 'llama-3.3-70b-versatile';

async function transcribeDirect(wavBuffer, language = 'auto') {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    // Get model from settings, fallback to default
    const model = getSetting('model') || DEFAULT_MODEL;

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
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (response.status === 401) {
                throw new Error('Invalid Groq API Key. Please verify your credentials in settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded (429).');
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Filter trivial results / hallucinations from silence
            if (!data.text || data.text.trim().length === 0 || data.text.trim().toLowerCase().includes('thanks for watching')) {
                return '';
            }

            return data.text.trim();

        } catch (error) {
            if (error.message.includes('Rate limit') || error.message.includes('Invalid API Key') || retries === 0) {
                throw error;
            }
            console.warn(`[Groq] Network error, retrying... (${error.message})`);
            await new Promise(r => setTimeout(r, 1000));
            retries--;
        }
    }
}

async function transcribe(wavBuffer, audioSeconds = 0, language = 'auto') {
    const item = { wavBuffer, audioSeconds, language };

    // Defer the execution to rate-limiter which executes it once the slot opens
    const processFunction = async (taskItem) => {
        return await transcribeDirect(taskItem.wavBuffer, taskItem.language);
    };

    return rateLimiter.enqueue(item, processFunction);
}

async function validateApiKey(apiKey) {
    if (!apiKey) return false;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function enhance(rawText, promptStyle = 'Clean') {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) return rawText;

    let systemPrompt = "Clean this dictated text. Remove filler words, fix punctuation and grammar. Keep original meaning and tone. Return only the cleaned text.";
    if (promptStyle === 'Formal') {
        systemPrompt = "Rewrite this dictated text in a formal, professional tone. Fix punctuation and grammar. Return only the cleaned text.";
    } else if (promptStyle === 'Casual') {
        systemPrompt = "Clean this up, keep it casual and conversational. Fix punctuation and grammar. Return only the cleaned text.";
    } else if (promptStyle === 'Bullets') {
        systemPrompt = "Convert this dictated text into concise bullet points. Return only the bullet points.";
    }

    try {
        const response = await fetch(GROQ_CHAT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ENHANCE_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: rawText }
                ],
                temperature: 0.3,
                max_completion_tokens: 1024
            })
        });

        if (!response.ok) {
            console.warn('[Enhance] API error', response.status);
            return rawText; // fallback
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.warn('[Enhance] Network error', error.message);
        return rawText; // fallback
    }
}

module.exports = {
    transcribe,
    transcribeDirect,
    enhance,
    validateApiKey
};
