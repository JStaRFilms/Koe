import * as SecureStore from 'expo-secure-store';

const GROQ_API_KEY_STORAGE_KEY = 'koe_groq_api_key';

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
  return await SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
}

/**
 * Removes the Groq API key from secure storage.
 */
export async function deleteGroqApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
}
