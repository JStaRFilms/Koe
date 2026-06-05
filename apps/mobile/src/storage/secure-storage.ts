import * as SecureStore from 'expo-secure-store';

const GROQ_API_KEY_STORAGE_KEY = 'koe_groq_api_key';
const ACCOUNT_SESSION_STORAGE_KEY = 'koe_mobile_account_session_v1';
const INSTALLATION_ID_STORAGE_KEY = 'koe_mobile_installation_id_v1';

export type AccountMode = 'byok' | 'managed';

export interface StoredAccountUser {
  id: string;
  email: string;
  displayName: string | null;
  defaultMode: AccountMode;
}

export interface StoredAccountDevice {
  id: string;
  platform: 'ios' | 'android' | 'web';
  label: string | null;
}

export interface StoredAccountSession {
  token: string;
  expiresAt: string;
  user: StoredAccountUser;
  device: StoredAccountDevice | null;
}

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

function createInstallationId() {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Securely stores the Groq API key on the device.
 */
export async function saveGroqApiKey(apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(GROQ_API_KEY_STORAGE_KEY, apiKey);
}

/**
 * Retrieves the Groq API key from secure storage.
 */
export async function getGroqApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
}

/**
 * Removes the Groq API key from secure storage.
 */
export async function deleteGroqApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
}

export async function saveAccountSession(session: StoredAccountSession): Promise<void> {
  await saveJson(ACCOUNT_SESSION_STORAGE_KEY, session);
}

export async function getAccountSession(): Promise<StoredAccountSession | null> {
  return loadJson<StoredAccountSession>(ACCOUNT_SESSION_STORAGE_KEY);
}

export async function clearAccountSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCOUNT_SESSION_STORAGE_KEY);
}

export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_STORAGE_KEY, created);
  return created;
}
