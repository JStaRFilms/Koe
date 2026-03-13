import * as SecureStore from 'expo-secure-store';

const APP_SETTINGS_STORAGE_KEY = 'koe_mobile_settings_v1';

export interface AppSettings {
  language: string;
  promptStyle: string;
  model: string;
  enhanceText: boolean;
  hasSeenOnboarding: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  promptStyle: 'Clean',
  model: 'llama-3.3-70b-versatile',
  enhanceText: true,
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
  return { ...DEFAULT_SETTINGS, ...settings };
}
