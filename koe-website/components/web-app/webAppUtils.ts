import { ApiErrorPayload } from "./types";

const SESSION_STORAGE_KEY = "koe_web_session_token_v1";
const INSTALLATION_STORAGE_KEY = "koe_web_installation_id_v1";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getInstallationId() {
  if (typeof window === "undefined") {
    return "web";
  }

  const existing = window.localStorage.getItem(INSTALLATION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(INSTALLATION_STORAGE_KEY, next);
  return next;
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "X-Koe-Client": "web",
  };
}

export async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  return payload.error?.message || `Request failed with HTTP ${response.status}.`;
}

export function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Unknown time";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export async function writeClipboard(text: string) {
  if (!text.trim()) {
    throw new Error("No transcript to copy.");
  }

  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard access is unavailable in this browser.");
  }

  await navigator.clipboard.writeText(text);
}
