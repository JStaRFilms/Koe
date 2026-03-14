import * as SecureStore from 'expo-secure-store';

const HISTORY_STORAGE_KEY = 'koe_mobile_history_v1';

export interface HistoryItem {
  id: string;
  timestamp: number;
  rawText: string;
  refinedText?: string | null;
  durationMillis: number;
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

export async function saveHistory(history: HistoryItem[]): Promise<void> {
  // Keep only the last 50 items to stay within SecureStore limits if any
  const trimmed = history.slice(0, 50);
  await saveJson(HISTORY_STORAGE_KEY, trimmed);
}

export async function loadHistory(): Promise<HistoryItem[]> {
  const history = await loadJson<HistoryItem[]>(HISTORY_STORAGE_KEY);
  return history ?? [];
}

export async function addToHistory(item: HistoryItem): Promise<void> {
  const existing = await loadHistory();
  const updated = [item, ...existing];
  await saveHistory(updated);
}

export async function clearHistory(): Promise<void> {
  await SecureStore.deleteItemAsync(HISTORY_STORAGE_KEY);
}
