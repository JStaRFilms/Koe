import { DEFAULT_CUSTOM_PROMPT, DEFAULT_WHISPER_MODEL } from '@koe/core';
import * as SecureStore from 'expo-secure-store';

const APP_SETTINGS_STORAGE_KEY = 'koe_mobile_settings_v1';
const SUPPORTED_TRANSCRIPTION_MODELS = new Set(['whisper-large-v3-turbo', 'whisper-large-v3']);
const SUPPORTED_PROMPT_STYLES = new Set(['Clean', 'Formal', 'Professional', 'Casual', 'Concise']);

export interface AppSettings {
  language: string;
  promptStyle: string;
  customPrompt: string;
  model: string;
  enhanceText: boolean;
  autoPaste: boolean;
  hasSeenOnboarding: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  promptStyle: 'Clean',
  customPrompt: DEFAULT_CUSTOM_PROMPT,
  model: DEFAULT_WHISPER_MODEL,
  enhanceText: true,
  autoPaste: true,
  hasSeenOnboarding: false,
};


async function saveJson(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

async function loadJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    await SecureStore.deleteItemAsync(key);
    return null;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await saveJson(APP_SETTINGS_STORAGE_KEY, settings);
}

export async function loadAppSettings(): Promise<AppSettings> {
  const settings = await loadJson<AppSettings>(APP_SETTINGS_STORAGE_KEY);
  const merged = { ...DEFAULT_SETTINGS, ...settings };

  if (!SUPPORTED_TRANSCRIPTION_MODELS.has(merged.model)) {
    merged.model = DEFAULT_SETTINGS.model;
  }

  if (!SUPPORTED_PROMPT_STYLES.has(merged.promptStyle)) {
    merged.promptStyle = DEFAULT_SETTINGS.promptStyle;
  }

  if (!merged.customPrompt?.trim()) {
    merged.customPrompt = DEFAULT_SETTINGS.customPrompt;
  }

  return merged;
}
