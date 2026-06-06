import {
  deleteAccountGroqCredential,
  getAccountSessionDetails,
  getAccountSnapshot,
  isInvalidSessionError,
  patchAccountMode,
  patchAccountSettings,
  putAccountGroqCredential,
  requestEmailVerification,
  requestPasswordReset,
  signInWithAccount,
  signOutAccount,
  signUpWithAccount,
  type AccountMode,
  type AccountSnapshot,
} from '../api/account-client';
import {
  clearAccountSession,
  getAccountSession,
  getOrCreateInstallationId,
  saveAccountSession,
  type StoredAccountSession,
} from '../storage/secure-storage';
import { saveSyncedAccountSettings } from '../storage/settings-storage';

export async function authenticateAccount(
  mode: 'signin' | 'signup',
  input: { email: string; password: string; displayName?: string },
): Promise<AccountSnapshot | null> {
  const installationId = await getOrCreateInstallationId();
  const auth =
    mode === 'signup'
      ? await signUpWithAccount({ ...input, installationId })
      : await signInWithAccount({ ...input, installationId });

  const session: StoredAccountSession = {
    token: auth.session.token,
    expiresAt: auth.session.expiresAt,
    user: auth.user,
    device: auth.device,
  };

  await saveAccountSession(session);
  return refreshStoredAccountSnapshot();
}

export async function refreshStoredAccountSnapshot(): Promise<AccountSnapshot | null> {
  const session = await getAccountSession();
  if (!session) {
    return null;
  }

  try {
    const [snapshot, sessionDetails] = await Promise.all([
      getAccountSnapshot(session),
      getAccountSessionDetails(session),
    ]);

    await saveSyncedAccountSettings(snapshot.settings);
    await saveAccountSession({
      ...session,
      expiresAt: sessionDetails.session.expiresAt,
      user: snapshot.user,
      device: sessionDetails.device ?? session.device,
    });

    return snapshot;
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
      return null;
    }

    throw error;
  }
}

export async function getStoredAccountSessionOrThrow(): Promise<StoredAccountSession> {
  const session = await getAccountSession();
  if (!session?.token) {
    throw new Error('Sign in to use account features.');
  }

  return session;
}

export async function signOutStoredAccount(): Promise<void> {
  const session = await getAccountSession();

  try {
    if (session) {
      await signOutAccount(session);
    }
  } finally {
    await clearAccountSession();
  }
}

export async function requestAccountPasswordReset(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Enter your email address first.');
  }

  await requestPasswordReset(trimmed);
}

export async function requestStoredEmailVerification(): Promise<void> {
  const session = await getStoredAccountSessionOrThrow();

  try {
    await requestEmailVerification(session);
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
    }
    throw error;
  }
}

export async function pushAccountSettings(patch: Partial<AccountSnapshot['settings']>): Promise<void> {
  const session = await getStoredAccountSessionOrThrow();

  try {
    const response = await patchAccountSettings(session, patch);
    await saveSyncedAccountSettings(response.settings);
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
    }
    throw error;
  }
}

export async function pushAccountMode(defaultMode: AccountMode): Promise<void> {
  const session = await getStoredAccountSessionOrThrow();

  try {
    await patchAccountMode(session, defaultMode);
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
    }
    throw error;
  }
}

export async function saveAccountGroqKey(apiKey: string): Promise<void> {
  const session = await getStoredAccountSessionOrThrow();

  try {
    await putAccountGroqCredential(session, apiKey);
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
    }
    throw error;
  }
}

export async function deleteAccountGroqKey(): Promise<void> {
  const session = await getStoredAccountSessionOrThrow();

  try {
    await deleteAccountGroqCredential(session);
  } catch (error) {
    if (isInvalidSessionError(error)) {
      await clearAccountSession();
    }
    throw error;
  }
}
