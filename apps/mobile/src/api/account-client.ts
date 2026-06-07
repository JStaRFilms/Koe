import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { parseErrorMessage, sanitizeRefinedText } from '@koe/core';
import type { StoredAccountSession } from '../storage/secure-storage';

export type AccountMode = 'byok' | 'managed';
export type AccountPlatform = 'ios' | 'android' | 'web';

export interface AccountUser {
  id: string;
  email: string;
  displayName: string | null;
  defaultMode: AccountMode;
  emailVerifiedAt: string | null;
}

export interface AccountDevice {
  id: string;
  platform: AccountPlatform;
  label: string | null;
}

export interface AuthResponse {
  user: AccountUser;
  session: {
    token: string;
    expiresAt: string;
  };
  device: AccountDevice | null;
}

export interface AccountSnapshot {
  user: AccountUser;
  resolvedMode: {
    mode: AccountMode;
    available: boolean;
    reason: string;
  };
  capabilities: {
    byok: {
      available: boolean;
      provider: 'groq';
      last4: string | null;
      updatedAt: string | null;
    };
    managed: {
      available: boolean;
      status: string;
      source: string | null;
      planCode: string | null;
      periodEndsAt: string | null;
      usage: {
        audioSecondsUsed: number;
        audioSecondsLimit: number;
        requestCountUsed: number;
        requestCountLimit: number;
        quotaWindow?: 'daily' | 'monthly';
        guaranteedFloorSeconds?: number;
        bonusCeilingSeconds?: number;
        activeManagedUsers24h?: number;
        safeDailyPoolSeconds?: number;
        source?: 'dynamic_free' | 'allocation' | 'paid';
      };
    };
  };
  settings: {
    language: string;
    promptStyle: string;
    customPrompt: string;
    enhanceText: boolean;
    model: string;
    updatedAt?: string | null;
  };
  recentHistory: Array<{
    id: string;
    requestId: string;
    mode: AccountMode;
    provider: string;
    model: string | null;
    rawText: string;
    refinedText: string | null;
    audioSeconds: number;
    createdAt: string | null;
  }>;
  policy: {
    mobilePurchaseUiEnabled: boolean;
  };
}

export interface AccountSessionResponse {
  authenticated: boolean;
  user: AccountUser;
  session: {
    expiresAt: string;
  };
  device: AccountDevice | null;
}

export interface AccountCredentialResponse {
  credential: {
    provider: 'groq';
    available: boolean;
    last4: string | null;
    updatedAt: string | null;
  };
}

export interface AccountModeResponse {
  defaultMode: AccountMode;
  resolvedMode: {
    mode: AccountMode;
    available: boolean;
    reason: string;
  };
}

export interface AccountSettingsResponse {
  settings: AccountSnapshot['settings'];
}

export interface AccountProcessResponse {
  requestId: string;
  historyId: string | null;
  mode: AccountMode;
  rawText: string;
  refinedText: string;
  empty: boolean;
  usage: {
    audioSecondsUsedThisRequest: number;
  };
}

export interface AccountRefineResponse {
  requestId: string;
  mode: AccountMode;
  refinedText: string;
  usage: {
    inputChars: number;
    outputChars: number;
  };
}

export class MobileAccountApiError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(code: string, message: string, status: number, retryable = false) {
    super(message);
    this.name = 'MobileAccountApiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
  message?: string;
}

interface AuthRequestInput {
  email: string;
  password: string;
  displayName?: string;
}

interface AuthHeadersContext {
  session?: StoredAccountSession | null;
}

interface ProcessAudioInput {
  session: StoredAccountSession;
  audioUri: string;
  requestId: string;
  mode?: AccountMode;
  language?: string;
  model?: string;
  enhanceText?: boolean;
  promptStyle?: string;
  customPrompt?: string;
  audioSeconds?: number;
}

interface RefineTranscriptInput {
  session: StoredAccountSession;
  requestId: string;
  rawText: string;
  mode?: AccountMode;
  promptStyle?: string;
  customPrompt?: string;
}

function normalizeApiBaseUrl(value: string) {
  return value
    .trim()
    .replace(/\/$/, '')
    .replace(/\/api\/v1$/, '');
}

const DEFAULT_KOE_API_BASE_URL = 'https://www.koevoice.xyz';

function resolveApiBaseUrl() {
  const envBase = process.env.EXPO_PUBLIC_KOE_API_BASE_URL?.trim();
  if (envBase) {
    return normalizeApiBaseUrl(envBase);
  }

  return normalizeApiBaseUrl(DEFAULT_KOE_API_BASE_URL);
}

export function resolveKoeWebAppUrl(path = '/app') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${normalizedPath}`;
}

async function fetchKoeApi(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new MobileAccountApiError(
      'NETWORK_ERROR',
      `Could not reach Koe API at ${url}. If you are testing locally, restart Expo with EXPO_PUBLIC_KOE_API_BASE_URL=http://192.168.100.5:3000 and make sure this URL opens on your phone. (${message})`,
      0,
      true,
    );
  }
}

function getPlatform(): AccountPlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'web';
}

function getDefaultDeviceLabel() {
  return `Koe ${getPlatform().toUpperCase()}`;
}

function getOsVersion() {
  const version = Platform.Version;
  return typeof version === 'string' || typeof version === 'number' ? String(version) : undefined;
}

function getAppVersion() {
  return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? undefined;
}

function buildHeaders(context?: AuthHeadersContext, extras?: Record<string, string>) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Koe-Client': getPlatform(),
  };

  const appVersion = getAppVersion();
  if (appVersion) {
    headers['X-Koe-App-Version'] = appVersion;
  }

  const deviceId = context?.session?.device?.id;
  if (deviceId) {
    headers['X-Koe-Device-Id'] = deviceId;
  }

  const token = context?.session?.token?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { ...headers, ...extras };
}

async function parseResponsePayload(response: Response): Promise<unknown> {
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

function toApiError(status: number, payload: unknown, fallback: string) {
  const data = (typeof payload === 'object' && payload ? payload : null) as ApiErrorPayload | null;
  const code = data?.error?.code || 'REQUEST_FAILED';
  const message = parseErrorMessage(payload, fallback);
  return new MobileAccountApiError(code, message, status, Boolean(data?.error?.retryable));
}

async function requestJson<T>(path: string, init: RequestInit, context?: AuthHeadersContext): Promise<T> {
  const url = `${resolveApiBaseUrl()}${path}`;
  const response = await fetchKoeApi(url, {
    ...init,
    headers: buildHeaders(context, init.headers as Record<string, string> | undefined),
  });

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    throw toApiError(response.status, payload, 'The request failed.');
  }

  return payload as T;
}

async function requestVoid(path: string, init: RequestInit, context?: AuthHeadersContext): Promise<void> {
  const url = `${resolveApiBaseUrl()}${path}`;
  const response = await fetchKoeApi(url, {
    ...init,
    headers: buildHeaders(context, init.headers as Record<string, string> | undefined),
  });

  if (response.status === 204) {
    return;
  }

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    throw toApiError(response.status, payload, 'The request failed.');
  }
}

function requestMultipartJson<T>(path: string, formData: FormData, context: AuthHeadersContext): Promise<T> {
  const url = `${resolveApiBaseUrl()}${path}`;
  const headers = buildHeaders(context);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 90_000;

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.onload = () => {
      let payload: unknown = null;
      const raw = String(xhr.responseText || '');
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = raw;
        }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(toApiError(xhr.status, payload, 'Account processing failed.'));
        return;
      }

      resolve(payload as T);
    };

    xhr.onerror = () => {
      reject(new MobileAccountApiError(
        'NETWORK_ERROR',
        `Could not upload audio to Koe API at ${url}. Auth and settings may still work even if file uploads are blocked by Expo, the local network, or the recorded file URI.`,
        0,
        true,
      ));
    };

    xhr.ontimeout = () => {
      reject(new MobileAccountApiError(
        'NETWORK_TIMEOUT',
        `Audio upload to Koe API timed out at ${url}. Try a shorter recording or restart the local backend.`,
        0,
        true,
      ));
    };

    xhr.send(formData);
  });
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

export function isInvalidSessionError(error: unknown) {
  return error instanceof MobileAccountApiError && (error.status === 401 || error.code === 'INVALID_SESSION');
}

export function normalizeAccountApiError(error: unknown, fallback: string): Error {
  if (!(error instanceof MobileAccountApiError)) {
    return error instanceof Error ? error : new Error(fallback);
  }

  switch (error.code) {
    case 'INVALID_SESSION':
      return new Error('Your account session expired. Sign in again to keep using account processing.');
    case 'MISSING_BYOK_CREDENTIAL':
      return new Error('BYOK mode is selected, but no Groq key is saved in your account vault yet.');
    case 'MODE_UNAVAILABLE':
      return new Error('Managed mode is not available for this account right now.');
    case 'MANAGED_LIMIT_EXCEEDED':
      return new Error('Managed usage is exhausted for this account. Switch modes or try again later.');
    case 'BAD_REQUEST':
      return new Error(error.message || fallback);
    default:
      if (error.status >= 500) {
        return new Error('The account service is unavailable right now. Retry in a moment.');
      }
      return new Error(error.message || fallback);
  }
}

export async function signUpWithAccount(input: AuthRequestInput & { installationId: string }): Promise<AuthResponse> {
  return requestJson<AuthResponse>(
    '/api/v1/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
        displayName: input.displayName?.trim() || undefined,
        platform: getPlatform(),
        installationId: input.installationId,
        deviceLabel: getDefaultDeviceLabel(),
        appVersion: getAppVersion(),
        osVersion: getOsVersion(),
      }),
    },
  );
}

export async function signInWithAccount(input: AuthRequestInput & { installationId: string }): Promise<AuthResponse> {
  return requestJson<AuthResponse>(
    '/api/v1/auth/signin',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
        platform: getPlatform(),
        installationId: input.installationId,
        deviceLabel: getDefaultDeviceLabel(),
        appVersion: getAppVersion(),
        osVersion: getOsVersion(),
      }),
    },
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  await requestVoid(
    '/api/v1/auth/request-password-reset',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    },
  );
}

export async function requestEmailVerification(session: StoredAccountSession): Promise<void> {
  await requestVoid('/api/v1/auth/request-email-verification', { method: 'POST' }, { session });
}

export async function getAccountSessionDetails(session: StoredAccountSession): Promise<AccountSessionResponse> {
  return requestJson<AccountSessionResponse>('/api/v1/auth/session', { method: 'GET' }, { session });
}

export async function signOutAccount(session: StoredAccountSession): Promise<void> {
  await requestVoid('/api/v1/auth/signout', { method: 'POST' }, { session });
}

export async function getAccountSnapshot(session: StoredAccountSession): Promise<AccountSnapshot> {
  return requestJson<AccountSnapshot>('/api/v1/account/snapshot', { method: 'GET' }, { session });
}

export async function patchAccountSettings(
  session: StoredAccountSession,
  patch: Partial<AccountSnapshot['settings']>,
): Promise<AccountSettingsResponse> {
  return requestJson<AccountSettingsResponse>(
    '/api/v1/account/settings',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
    { session },
  );
}

export async function patchAccountMode(
  session: StoredAccountSession,
  defaultMode: AccountMode,
): Promise<AccountModeResponse> {
  return requestJson<AccountModeResponse>(
    '/api/v1/account/mode',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultMode }),
    },
    { session },
  );
}

export async function putAccountGroqCredential(
  session: StoredAccountSession,
  apiKey: string,
): Promise<AccountCredentialResponse> {
  return requestJson<AccountCredentialResponse>(
    '/api/v1/account/credentials/groq',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim(), validate: true }),
    },
    { session },
  );
}

export async function deleteAccountGroqCredential(session: StoredAccountSession): Promise<void> {
  await requestVoid('/api/v1/account/credentials/groq', { method: 'DELETE' }, { session });
}

function inferAudioMimeType(audioUri: string) {
  const lower = audioUri.toLowerCase();
  if (lower.includes('.webm')) return 'audio/webm';
  if (lower.includes('.wav')) return 'audio/wav';
  if (lower.includes('.mp3')) return 'audio/mpeg';
  return 'audio/m4a';
}

export async function processAccountAudio(input: ProcessAudioInput): Promise<AccountProcessResponse> {
  const audioBase64 = await FileSystem.readAsStringAsync(input.audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return requestJson<AccountProcessResponse>(
    '/api/v1/process',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        audioMimeType: inferAudioMimeType(input.audioUri),
        requestId: input.requestId,
        mode: input.mode,
        language: input.language,
        model: input.model,
        promptStyle: input.promptStyle,
        customPrompt: input.customPrompt,
        enhanceText: Boolean(input.enhanceText),
        audioSeconds: Math.max(0, input.audioSeconds || 0),
      }),
    },
    { session: input.session },
  );
}

export async function refineAccountTranscript(input: RefineTranscriptInput): Promise<AccountRefineResponse> {
  const response = await requestJson<AccountRefineResponse>(
    '/api/v1/process/refine',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: input.requestId,
        rawText: input.rawText,
        mode: input.mode,
        promptStyle: input.promptStyle,
        customPrompt: input.customPrompt,
      }),
    },
    { session: input.session },
  );

  return {
    ...response,
    refinedText: sanitizeRefinedText(response.refinedText) || input.rawText,
  };
}
