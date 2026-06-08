import {
  DEFAULT_ENHANCE_MODEL,
  DEFAULT_WHISPER_MODEL,
  parseErrorMessage,
  REFINEMENT_GUARDRAILS,
  resolveEnhancementPrompt,
  sanitizeRefinedText,
  type ProviderOptions,
  type TranscriptionProvider,
} from '@koe/core';
import {
  isInvalidSessionError,
  normalizeAccountApiError,
  processAccountAudio,
  refineAccountTranscript,
} from '../api/account-client';
import { clearAccountSession, getAccountSession, getGroqApiKey } from '../storage/secure-storage';

export interface MobileAudioUploadSource {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

function normalizeApiError(status: number, payload: unknown, fallback: string): Error {
  const parsed = parseErrorMessage(payload, fallback);

  if (status === 401 || status === 403) {
    return new Error('Your API key was rejected. Check the saved key and try again.');
  }

  if (status >= 500) {
    return new Error('The processing service is unavailable right now. Retry in a moment.');
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

function inferAudioMimeType(audioUri: string, providedMimeType?: string) {
  if (providedMimeType?.trim()) {
    return providedMimeType.trim();
  }

  const lower = audioUri.toLowerCase();
  if (lower.includes('.webm')) return 'audio/webm';
  if (lower.includes('.wav')) return 'audio/wav';
  if (lower.includes('.mp3')) return 'audio/mpeg';
  if (lower.includes('.ogg')) return 'audio/ogg';
  if (lower.includes('.flac')) return 'audio/flac';
  if (lower.includes('.aac')) return 'audio/aac';
  if (lower.includes('.caf')) return 'audio/x-caf';
  if (lower.includes('.mp4')) return 'audio/mp4';
  return 'audio/m4a';
}

function inferAudioFileName(audioUri: string, providedFileName?: string) {
  if (providedFileName?.trim()) {
    return providedFileName.trim();
  }

  const normalized = audioUri.split('?')[0] || audioUri;
  const segments = normalized.split('/');
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    return decodeURIComponent(lastSegment);
  }

  const mimeType = inferAudioMimeType(audioUri);
  if (mimeType === 'audio/webm') return 'recording.webm';
  if (mimeType === 'audio/wav') return 'recording.wav';
  if (mimeType === 'audio/mpeg') return 'recording.mp3';
  return 'recording.m4a';
}

function normalizeAudioSource(audioSource: string | MobileAudioUploadSource): MobileAudioUploadSource {
  return typeof audioSource === 'string' ? { uri: audioSource } : audioSource;
}

async function appendAudioFile(formData: FormData, audioSource: string | MobileAudioUploadSource): Promise<void> {
  const { uri, fileName, mimeType } = normalizeAudioSource(audioSource);
  const resolvedFileName = inferAudioFileName(uri, fileName);
  const resolvedMimeType = inferAudioMimeType(uri, mimeType);

  if (uri.startsWith('blob:') || uri.startsWith('http')) {
    const blobResponse = await fetch(uri);
    const blob = await blobResponse.blob();
    formData.append('file', blob, resolvedFileName);
    return;
  }

  formData.append('file', {
    uri,
    name: resolvedFileName,
    type: resolvedMimeType,
  } as never);
}

function createRequestId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0'));

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

async function normalizeAuthenticatedError(error: unknown, fallback: string) {
  if (isInvalidSessionError(error)) {
    await clearAccountSession();
  }

  return normalizeAccountApiError(error, fallback);
}

export class MobileGroqProvider implements TranscriptionProvider {
  async transcribeSegment(audioSource: string | MobileAudioUploadSource, options: ProviderOptions): Promise<string> {
    const normalizedSource = normalizeAudioSource(audioSource);
    const accountSession = await getAccountSession();
    if (accountSession?.token) {
      options.onStage?.({
        stage: 'transcribing',
        label: 'Sending audio to your account backend...',
        progress: 32,
      });

      try {
        const response = await processAccountAudio({
          session: accountSession,
          audioUri: normalizedSource.uri,
          audioMimeType: normalizedSource.mimeType,
          audioFileName: normalizedSource.fileName,
          requestId: createRequestId(),
          clientSessionId: options.sessionId,
          language: options.language,
          model: options.model || DEFAULT_WHISPER_MODEL,
          enhanceText: false,
          audioSeconds: options.audioSeconds,
        });

        return response.rawText || '';
      } catch (error) {
        throw await normalizeAuthenticatedError(error, 'Account transcription failed.');
      }
    }

    const apiKey = options.apiKey || (await getGroqApiKey());
    if (!apiKey) {
      throw new Error('No API key is saved on this device.');
    }

    const formData = new FormData();
    await appendAudioFile(formData, normalizedSource);
    formData.append('model', options.model || DEFAULT_WHISPER_MODEL);

    if (options.language && options.language !== 'auto') {
      formData.append('language', options.language);
    }

    options.onStage?.({
      stage: 'transcribing',
      label: 'Sending audio for transcription...',
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

    const accountSession = await getAccountSession();
    if (accountSession?.token) {
      options.onStage?.({
        stage: 'refining',
        label: 'Refining transcript through your account...',
        progress: 82,
      });

      try {
        const response = await refineAccountTranscript({
          session: accountSession,
          requestId: createRequestId(),
          clientSessionId: options.sessionId,
          rawText: trimmed,
          promptStyle: options.promptStyle,
          customPrompt: options.customPrompt,
        });

        return response.refinedText || trimmed;
      } catch (error) {
        throw await normalizeAuthenticatedError(error, 'Transcript refinement failed.');
      }
    }

    const apiKey = options.apiKey || (await getGroqApiKey());
    if (!apiKey) {
      throw new Error('No API key is saved on this device.');
    }

    const prompt = resolveEnhancementPrompt(options.promptStyle, options.customPrompt);
    const systemPrompt = `${REFINEMENT_GUARDRAILS} ${prompt}`.trim();

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
        model: DEFAULT_ENHANCE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Refine only the text inside <transcript> tags.\n<transcript>\n${trimmed}\n</transcript>`,
          },
        ],
        temperature: 0.2,
      }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw normalizeApiError(response.status, payload, 'Transcript refinement failed.');
    }

    if (typeof payload === 'object' && payload && 'choices' in payload) {
      const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
        ?.message?.content;
      return sanitizeRefinedText(content || trimmed) || trimmed;
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
