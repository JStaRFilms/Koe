import { UsageTracker, type UsageStats } from '@koe/core';
import * as SecureStore from 'expo-secure-store';

const RETRY_STATE_STORAGE_KEY = 'koe_mobile_retry_state_v1';
const USAGE_STATS_STORAGE_KEY = 'koe_mobile_usage_stats_v1';

export interface PersistedRetryState {
  sessionId: string;
  audioUri?: string | null;
  audioUris?: string[];
  durationMillis: number;
  createdAt: number;
  lastError?: string | null;
  rawText?: string | null;
  interrupted?: boolean;
}

export function getRetryAudioUris(state: PersistedRetryState): string[] {
  if (Array.isArray(state.audioUris) && state.audioUris.length > 0) {
    return state.audioUris.filter((value): value is string => Boolean(value));
  }

  return state.audioUri ? [state.audioUri] : [];
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

export async function saveRetryState(state: PersistedRetryState): Promise<void> {
  await saveJson(RETRY_STATE_STORAGE_KEY, state);
}

export async function loadRetryState(): Promise<PersistedRetryState | null> {
  return loadJson<PersistedRetryState>(RETRY_STATE_STORAGE_KEY);
}

export async function clearRetryState(): Promise<void> {
  await SecureStore.deleteItemAsync(RETRY_STATE_STORAGE_KEY);
}

export async function markRetryStateInterrupted(): Promise<PersistedRetryState | null> {
  const existing = await loadRetryState();
  if (!existing) {
    return null;
  }

  const updated: PersistedRetryState = {
    ...existing,
    interrupted: true,
    lastError:
      existing.lastError ??
      'The app was suspended before processing finished. Retry the saved recording to continue.',
  };

  await saveRetryState(updated);
  return updated;
}

export async function loadUsageTracker(): Promise<UsageTracker> {
  const stats = await loadJson<UsageStats>(USAGE_STATS_STORAGE_KEY);
  return new UsageTracker(stats ?? undefined);
}

export async function saveUsageTracker(tracker: UsageTracker): Promise<UsageStats> {
  const stats = tracker.getStats();
  await saveJson(USAGE_STATS_STORAGE_KEY, stats);
  return stats;
}
