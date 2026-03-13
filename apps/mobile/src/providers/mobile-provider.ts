import {
  parseErrorMessage,
  resolveEnhancementPrompt,
  type ProviderOptions,
  type TranscriptionProvider,
} from '@koe/core';
import { getGroqApiKey } from '../storage/secure-storage';

function normalizeApiError(status: number, payload: unknown, fallback: string): Error {
  const parsed = parseErrorMessage(payload, fallback);

  if (status === 401 || status === 403) {
    return new Error('Your Groq API key was rejected. Check the saved key and try again.');
  }

  if (status >= 500) {
    return new Error('Groq is unavailable right now. Retry in a moment.');
  }

  return new Error(parsed);
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function appendAudioFile(formData: FormData, audioUri: string): Promise<void> {
  if (audioUri.startsWith('blob:') || audioUri.startsWith('http')) {
    const blobResponse = await fetch(audioUri);
    const blob = await blobResponse.blob();
    formData.append('file', blob, 'recording.webm');
    return;
  }

  formData.append('file', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as never);
}

export class MobileGroqProvider implements TranscriptionProvider {
  async transcribeSegment(audioUri: string, options: ProviderOptions): Promise<string> {
    const apiKey = options.apiKey || (await getGroqApiKey());
    if (!apiKey) {
      throw new Error('No Groq API key is saved on this device.');
    }

    const formData = new FormData();
    await appendAudioFile(formData, audioUri);
    formData.append('model', options.model || 'whisper-large-v3-turbo');

    if (options.language && options.language !== 'auto') {
      formData.append('language', options.language);
    }

    options.onStage?.({
      stage: 'transcribing',
      label: 'Sending audio to Groq...',
      progress: 35,
    });

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw normalizeApiError(response.status, payload, 'Transcription failed.');
    }

    if (typeof payload === 'object' && payload && 'text' in payload) {
      return String((payload as { text?: string }).text || '');
    }

    return '';
  }

  async refineTranscript(text: string, options: ProviderOptions): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) {
      return '';
    }

    const apiKey = options.apiKey || (await getGroqApiKey());
    if (!apiKey) {
      throw new Error('No Groq API key is saved on this device.');
    }

    const prompt = resolveEnhancementPrompt(options.promptStyle, options.customPrompt);

    options.onStage?.({
      stage: 'refining',
      label: 'Refining transcript...',
      progress: 82,
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'moonshotai/kimi-k2-instruct-0905',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: trimmed },
        ],
        temperature: 0.1,
      }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw normalizeApiError(response.status, payload, 'Transcript refinement failed.');
    }

    if (typeof payload === 'object' && payload && 'choices' in payload) {
      const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
        ?.message?.content;
      return String(content || trimmed).trim();
    }

    return trimmed;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey.trim()) {
      return false;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const mobileProvider = new MobileGroqProvider();
