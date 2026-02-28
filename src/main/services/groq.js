const { getSetting } = require('./settings');
const rateLimiter = require('./rate-limiter');

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

async function transcribeDirect(wavBuffer, language = 'auto') {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', MODEL);

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

module.exports = {
    transcribe,
    transcribeDirect
};
