import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  useColorScheme,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { normalizeAccountApiError, resolveKoeWebAppUrl, type AccountMode, type AccountSnapshot } from '../src/api/account-client';
import {
  deleteAccountGroqKey,
  pushAccountMode,
  pushAccountSettings,
  refreshStoredAccountSnapshot,
  requestStoredEmailVerification,
  saveAccountGroqKey,
  signOutStoredAccount,
} from '../src/account/account-service';
import { describeAccountActivity, describeManagedQuota } from '../src/account/managed-quota-copy';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import {
  deleteGroqApiKey,
  getAccountSession,
  getGroqApiKey,
  saveGroqApiKey,
  type StoredAccountSession,
} from '../src/storage/secure-storage';
import { loadAppSettings, saveAppSettings, type AppSettings } from '../src/storage/settings-storage';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalCard } from '../src/components/BrutalCard';
import { BrutalButton } from '../src/components/BrutalButton';
import { AccountAuthCard } from '../src/components/AccountAuthCard';
import {
  type AndroidUpdateInfo,
  checkForAndroidUpdate,
  downloadAndInstallAndroidUpdate,
  getAndroidUpdateErrorMessage,
  getCurrentAndroidAppVersionLabel,
  openAndroidUnknownAppSourcesSettings,
  openAndroidUpdateRelease,
} from '../src/updates/android-updates';

const { width } = Dimensions.get('window');

const PROMPT_STYLE_OPTIONS = [
  { label: 'Clean', value: 'Clean' },
  { label: 'Formal', value: 'Formal' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Concise', value: 'Concise' },
] as const;

const MODEL_OPTIONS = [
  { label: 'Fast (Turbo)', value: 'whisper-large-v3-turbo' },
  { label: 'Accurate (Large-v3)', value: 'whisper-large-v3' },
] as const;

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Auto', value: 'auto' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
] as const;

function maskKey(value: string | null): string {
  if (!value) {
    return 'No key saved';
  }

  if (value.length <= 8) {
    return 'Saved on this device';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function describeAccountKey(snapshot: AccountSnapshot | null) {
  if (!snapshot?.capabilities.byok.available) {
    return 'No account key saved';
  }

  return snapshot.capabilities.byok.last4 ? `Saved ending in ${snapshot.capabilities.byok.last4}` : 'Saved in account vault';
}

function getEmailVerifiedAt(snapshot: AccountSnapshot | null, session: StoredAccountSession | null) {
  return snapshot?.user.emailVerifiedAt ?? session?.user.emailVerifiedAt ?? null;
}

function describeEmailVerification(snapshot: AccountSnapshot | null, session: StoredAccountSession | null) {
  const verifiedAt = getEmailVerifiedAt(snapshot, session);
  return verifiedAt ? `Verified ${new Date(verifiedAt).toLocaleDateString()}` : 'Unverified';
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const [accountSession, setAccountSession] = useState<StoredAccountSession | null>(null);
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [accountKeyInput, setAccountKeyInput] = useState('');
  const [savedKeyLabel, setSavedKeyLabel] = useState('Loading...');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [customPromptDraft, setCustomPromptDraft] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<AccountMode | null>(null);
  const [isRefreshingAccount, setIsRefreshingAccount] = useState(false);
  const [isRequestingEmailVerification, setIsRequestingEmailVerification] = useState(false);
  const [isOpeningWebAccount, setIsOpeningWebAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingAccountKey, setIsSavingAccountKey] = useState(false);
  const [isDeletingAccountKey, setIsDeletingAccountKey] = useState(false);
  const [isSavingLocalKey, setIsSavingLocalKey] = useState(false);
  const [isClearingLocalKey, setIsClearingLocalKey] = useState(false);
  const [showDeviceFallback, setShowDeviceFallback] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AndroidUpdateInfo | null>(null);
  const [updateStatusMessage, setUpdateStatusMessage] = useState('Checking Android release feed...');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);

  const notifySuccess = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Optional.
    }
  };

  const notifyLightImpact = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Optional.
    }
  };

  const refreshAndroidUpdate = useCallback(async (manual = false) => {
    if (Platform.OS !== 'android') {
      setUpdateStatusMessage('APK updates are only available on Android.');
      return;
    }

    setIsCheckingUpdate(true);
    if (manual) {
      setFeedbackMessage('Checking GitHub for Android updates...');
      setErrorMessage(null);
    }

    const result = await checkForAndroidUpdate();

    if (result.status === 'available') {
      setAvailableUpdate(result.update);
      setUpdateStatusMessage(`Version ${result.update.versionName} is ready to install.`);
      if (manual) {
        setFeedbackMessage('Android update found.');
      }
    } else if (result.status === 'up-to-date') {
      setAvailableUpdate(null);
      setUpdateStatusMessage(`You are up to date on ${result.currentVersionName}.`);
      if (manual) {
        setFeedbackMessage('Koe Android is up to date.');
      }
    } else if (result.status === 'unsupported') {
      setAvailableUpdate(null);
      setUpdateStatusMessage(result.reason);
      if (manual) {
        setFeedbackMessage(null);
      }
    } else if (result.status === 'skipped') {
      setAvailableUpdate(result.update);
      setUpdateStatusMessage(`Version ${result.update.versionName} is available. You skipped the launch prompt for this version.`);
      if (manual) {
        setFeedbackMessage('Android update found.');
      }
    } else {
      setAvailableUpdate(null);
      setUpdateStatusMessage(result.message);
      if (manual) {
        setFeedbackMessage(null);
        setErrorMessage(result.message);
      }
    }

    setIsCheckingUpdate(false);
  }, []);

  const loadData = useCallback(async () => {
    const [existingKey, localSettings, storedSession] = await Promise.all([
      getGroqApiKey(),
      loadAppSettings(),
      getAccountSession(),
    ]);

    let nextSession = storedSession;
    let nextSnapshot: AccountSnapshot | null = null;
    let nextSettings = localSettings;

    if (storedSession?.token) {
      try {
        nextSnapshot = await refreshStoredAccountSnapshot();
        nextSession = await getAccountSession();
        nextSettings = await loadAppSettings();
      } catch (error) {
        setErrorMessage(normalizeAccountApiError(error, 'Could not refresh your account snapshot.').message);
      }
    }

    setSavedKeyLabel(maskKey(existingKey));
    setAccountSession(nextSession);
    setSnapshot(nextSnapshot);
    setSettings(nextSettings);
    setCustomPromptDraft(nextSettings.customPrompt);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      void refreshAndroidUpdate(false);
    }, [loadData, refreshAndroidUpdate])
  );

  const saveLocalKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Enter a Groq key to save it on this device.');
      return;
    }

    setIsSavingLocalKey(true);
    setFeedbackMessage(accountSession ? 'Saving local fallback key...' : 'Saving local Groq key...');
    setErrorMessage(null);

    try {
      await saveGroqApiKey(trimmed);
      setSavedKeyLabel(maskKey(trimmed));
      setApiKeyInput('');
      setFeedbackMessage(accountSession ? 'Saved local fallback key.' : 'Saved local Groq key.');
      await notifySuccess();
    } finally {
      setIsSavingLocalKey(false);
    }
  };

  const clearLocalKey = async () => {
    setIsClearingLocalKey(true);
    setFeedbackMessage('Clearing local fallback key...');
    setErrorMessage(null);

    try {
      await deleteGroqApiKey();
      setSavedKeyLabel(maskKey(null));
      setApiKeyInput('');
      setFeedbackMessage('Cleared the local fallback key.');
      await notifyLightImpact();
    } finally {
      setIsClearingLocalKey(false);
    }
  };

  const updateLocalAndMaybeRemoteSettings = async (
    patch: Partial<Pick<AppSettings, 'language' | 'promptStyle' | 'customPrompt' | 'enhanceText' | 'model'>>,
  ) => {
    if (!settings) {
      return;
    }

    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveAppSettings(updated);
    setErrorMessage(null);

    try {
      if (accountSession?.token) {
        await pushAccountSettings(patch);
      }
      await notifyLightImpact();
    } catch (error) {
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
      setErrorMessage(normalizeAccountApiError(error, 'Could not sync settings to your account.').message);
    }
  };

  const saveCustomPrompt = async () => {
    await updateLocalAndMaybeRemoteSettings({ customPrompt: customPromptDraft.trim() });
  };

  const handleAuthComplete = async () => {
    setFeedbackMessage('Signed in. Account processing is ready.');
    setErrorMessage(null);
    await loadData();
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setFeedbackMessage('Signing out...');
    setErrorMessage(null);

    try {
      await signOutStoredAccount();
      setFeedbackMessage('Signed out. Local fallback remains on this device.');
      setSnapshot(null);
      setAccountSession(null);
      setShowDeviceFallback(false);
      await notifyLightImpact();
      await loadData();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRefreshAccount = async () => {
    if (isRefreshingAccount) {
      return;
    }

    setIsRefreshingAccount(true);
    setFeedbackMessage('Refreshing account snapshot...');
    setErrorMessage(null);

    try {
      const refreshed = await refreshStoredAccountSnapshot();
      const nextSession = await getAccountSession();
      const nextSettings = await loadAppSettings();
      setSnapshot(refreshed);
      setAccountSession(nextSession);
      setSettings(nextSettings);
      setCustomPromptDraft(nextSettings.customPrompt);

      if (!refreshed || !nextSession) {
        setFeedbackMessage(null);
        setErrorMessage('Your account session expired. Sign in again to refresh account data.');
        return;
      }

      setFeedbackMessage('Account snapshot refreshed.');
      setErrorMessage(null);
      await notifyLightImpact();
    } catch (error) {
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
      setErrorMessage(normalizeAccountApiError(error, 'Could not refresh your account.').message);
    } finally {
      setIsRefreshingAccount(false);
    }
  };

  const handleRequestEmailVerification = async () => {
    if (isRequestingEmailVerification) {
      return;
    }

    setIsRequestingEmailVerification(true);
    setFeedbackMessage('Sending verification email...');
    setErrorMessage(null);

    try {
      await requestStoredEmailVerification();
      setFeedbackMessage('Verification email sent. Open the link in your inbox to confirm this address.');
      await notifySuccess();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not send a verification email.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
    } finally {
      setIsRequestingEmailVerification(false);
    }
  };

  const handleOpenWebAccount = async () => {
    if (isOpeningWebAccount) {
      return;
    }

    setIsOpeningWebAccount(true);
    setFeedbackMessage('Opening Koe account in your browser...');
    setErrorMessage(null);

    try {
      await Linking.openURL(resolveKoeWebAppUrl('/app'));
      await notifyLightImpact();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not open Koe account on web.');
      setFeedbackMessage(null);
    } finally {
      setIsOpeningWebAccount(false);
    }
  };

  const handleSaveAccountKey = async () => {
    const trimmed = accountKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Enter a Groq key to save it to your account vault.');
      return;
    }

    setIsSavingAccountKey(true);
    setFeedbackMessage('Saving account BYOK to the vault...');
    setErrorMessage(null);

    try {
      await saveAccountGroqKey(trimmed);
      setAccountKeyInput('');
      setFeedbackMessage('Saved your Groq key to the account vault.');
      await notifySuccess();
      await loadData();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not save your account Groq key.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
    } finally {
      setIsSavingAccountKey(false);
    }
  };

  const handleDeleteAccountKey = async () => {
    setIsDeletingAccountKey(true);
    setFeedbackMessage('Deleting account BYOK from the vault...');
    setErrorMessage(null);

    try {
      await deleteAccountGroqKey();
      setFeedbackMessage('Removed your account Groq key.');
      await notifyLightImpact();
      await loadData();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not remove your account Groq key.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
    } finally {
      setIsDeletingAccountKey(false);
    }
  };

  const handleModeChange = async (mode: AccountMode) => {
    if (pendingMode) {
      return;
    }

    setPendingMode(mode);
    setSnapshot((current) => current
      ? {
          ...current,
          user: { ...current.user, defaultMode: mode },
          resolvedMode: { ...current.resolvedMode, mode },
        }
      : current);
    setFeedbackMessage(`Switching account mode to ${mode}...`);
    setErrorMessage(null);

    try {
      await pushAccountMode(mode);
      setFeedbackMessage(`Switched account mode to ${mode}.`);
      setErrorMessage(null);
      await notifyLightImpact();
      await loadData();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not switch account mode.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      } else {
        await loadData();
      }
    } finally {
      setPendingMode(null);
    }
  };

  const handleInstallAndroidUpdate = async () => {
    if (!availableUpdate || isInstallingUpdate) {
      return;
    }

    setIsInstallingUpdate(true);
    setFeedbackMessage(`Downloading Koe ${availableUpdate.versionName} APK...`);
    setErrorMessage(null);

    try {
      await downloadAndInstallAndroidUpdate(availableUpdate);
      setFeedbackMessage('Android installer opened. Approve the install to finish updating Koe.');
      await notifySuccess();
    } catch (error) {
      setErrorMessage(getAndroidUpdateErrorMessage(error));
      setFeedbackMessage(null);
    } finally {
      setIsInstallingUpdate(false);
    }
  };

  const handleOpenUpdateRelease = async () => {
    if (!availableUpdate) {
      return;
    }

    try {
      await openAndroidUpdateRelease(availableUpdate);
    } catch (error) {
      setErrorMessage(getAndroidUpdateErrorMessage(error));
    }
  };

  const handleOpenInstallSettings = async () => {
    try {
      await openAndroidUnknownAppSourcesSettings();
    } catch (error) {
      setErrorMessage(getAndroidUpdateErrorMessage(error));
    }
  };

  if (!settings) {
    return (
      <View style={styles.outer}>
        <GridBackground />
        <ScanlineOverlay />
        <View style={styles.loadingContainer}>
          <Text style={[styles.banner, { color: theme.accent, borderColor: theme.accent }]}>Loading settings and account state...</Text>
        </View>
      </View>
    );
  }

  const showLocalFallbackControls = !accountSession || showDeviceFallback;
  const accountEmailVerifiedAt = getEmailVerifiedAt(snapshot, accountSession);
  const accountEmailVerified = Boolean(accountEmailVerifiedAt);

  return (
    <View style={styles.outer}>
      <GridBackground />
      <ScanlineOverlay />
      <View style={styles.kanjiContainer} pointerEvents="none">
        <Text style={[styles.kanji, { color: theme.border, opacity: 0.1 }]}>{'\u58F0'}</Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {feedbackMessage ? (
          <Text style={[styles.banner, { color: theme.success, borderColor: theme.success }]}>{feedbackMessage}</Text>
        ) : null}
        {errorMessage ? (
          <Text style={[styles.banner, { color: theme.danger, borderColor: theme.danger }]}>{errorMessage}</Text>
        ) : null}

        {Platform.OS === 'android' ? (
          <BrutalCard headerTitle="Android Updates // GitHub APK">
            <View style={styles.itemBody}>
              <View style={styles.metaRow}>
                <Text style={[styles.label, { color: theme.textDim }]}>Installed version</Text>
                <Text style={[styles.accountValue, { color: theme.text }]}>Koe {getCurrentAndroidAppVersionLabel()}</Text>
              </View>

              <Text style={[styles.statusMsg, { color: availableUpdate ? theme.accent : theme.textDim }]}> 
                {isCheckingUpdate ? 'Checking GitHub release feed...' : updateStatusMessage}
              </Text>

              {availableUpdate ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Available APK</Text>
                  <Text style={[styles.statusMsg, { color: theme.text }]}> 
                    {availableUpdate.assetName ?? `Koe ${availableUpdate.versionName}`}
                    {availableUpdate.assetSize ? ` // ${(availableUpdate.assetSize / 1024 / 1024).toFixed(1)} MB` : ''}
                  </Text>
                  {availableUpdate.releaseNotes ? (
                    <Text style={[styles.helperCopy, { color: theme.textDim }]} numberOfLines={4}>
                      {availableUpdate.releaseNotes}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <BrutalButton
                  onPress={() => void refreshAndroidUpdate(true)}
                  title={isCheckingUpdate ? 'Checking...' : 'Check now'}
                  variant="outline"
                  disabled={isCheckingUpdate || isInstallingUpdate}
                  style={{ flex: 1 }}
                />
                {availableUpdate ? (
                  <BrutalButton
                    onPress={() => void handleInstallAndroidUpdate()}
                    title={isInstallingUpdate ? 'Downloading...' : 'Download & install'}
                    disabled={isInstallingUpdate || isCheckingUpdate}
                    style={{ flex: 1 }}
                  />
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <BrutalButton
                  onPress={() => void handleOpenInstallSettings()}
                  title="Install permission"
                  variant="outline"
                  style={{ flex: 1 }}
                />
                {availableUpdate ? (
                  <BrutalButton
                    onPress={() => void handleOpenUpdateRelease()}
                    title="Open release"
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                ) : null}
              </View>

              <Text style={[styles.helperCopy, { color: theme.textDim }]}> 
                Updates are sideloaded from the latest GitHub Release APK. Android will always ask you to approve the install.
              </Text>
            </View>
          </BrutalCard>
        ) : null}

        {!accountSession ? (
          <AccountAuthCard
            headerTitle="Account // Sign in"
            initialMode="signin"
            helperText="Sign in to use the same account across devices and unlock managed mode when your account allows it."
            onAuthenticated={handleAuthComplete}
          />
        ) : (
          <>
            <BrutalCard headerTitle="Account // Snapshot">
              <View style={styles.itemBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Email</Text>
                  <Text selectable style={[styles.accountValue, { color: theme.text }]}>
                    {snapshot?.user.email || accountSession.user.email}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Email status</Text>
                  <Text style={[styles.statusMsg, { color: accountEmailVerified ? theme.success : theme.accent }]}>
                    {describeEmailVerification(snapshot, accountSession)}
                  </Text>
                </View>

                {!accountEmailVerified ? (
                  <BrutalButton
                    onPress={() => void handleRequestEmailVerification()}
                    title={isRequestingEmailVerification ? 'Sending...' : 'Resend verification'}
                    variant="outline"
                    disabled={isRequestingEmailVerification || isRefreshingAccount || isSigningOut}
                    style={{ width: '100%' }}
                  />
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Resolved mode</Text>
                  <Text style={[styles.accountValue, { color: theme.accent }]}>
                    {snapshot?.resolvedMode.mode || accountSession.user.defaultMode}
                    {snapshot?.resolvedMode.available === false ? ' // unavailable' : ''}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Account today</Text>
                  <Text style={[styles.statusMsg, { color: theme.textDim }]}>{describeAccountActivity(snapshot)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Managed quota</Text>
                  <Text style={[styles.statusMsg, { color: theme.textDim }]}>{describeManagedQuota(snapshot)}</Text>
                </View>

                <BrutalButton
                  onPress={() => void handleOpenWebAccount()}
                  title={isOpeningWebAccount ? 'Opening...' : 'Open Koe account on web'}
                  variant="outline"
                  disabled={isOpeningWebAccount || isRefreshingAccount || isSigningOut}
                  style={{ width: '100%' }}
                />

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Account BYOK</Text>
                  <Text style={[styles.statusMsg, { color: theme.textDim }]}>{describeAccountKey(snapshot)}</Text>
                </View>

                <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Default mode</Text>
                <View style={styles.optionGrid}>
                  <BrutalButton
                    onPress={() => void handleModeChange('managed')}
                    title={pendingMode === 'managed' ? 'Switching...' : 'Managed'}
                    variant={(pendingMode || snapshot?.user.defaultMode) === 'managed' ? 'primary' : 'outline'}
                    disabled={Boolean(pendingMode)}
                    small
                  />
                  <BrutalButton
                    onPress={() => void handleModeChange('byok')}
                    title={pendingMode === 'byok' ? 'Switching...' : 'BYOK'}
                    variant={(pendingMode || snapshot?.user.defaultMode) === 'byok' ? 'primary' : 'outline'}
                    disabled={Boolean(pendingMode)}
                    small
                  />
                </View>

                <View style={styles.actionRow}>
                  <BrutalButton onPress={() => void handleRefreshAccount()} title={isRefreshingAccount ? 'Refreshing...' : 'Refresh'} variant="outline" disabled={isRefreshingAccount || isSigningOut} style={{ flex: 1 }} />
                  <BrutalButton onPress={() => void handleSignOut()} title={isSigningOut ? 'Signing out...' : 'Sign out'} variant="danger" disabled={isSigningOut || isRefreshingAccount} />
                </View>

                <Text style={[styles.helperCopy, { color: theme.textDim }]}>
                  Managed mode is server-granted in this build. Plan changes happen on the Koe web account page.
                </Text>
              </View>
            </BrutalCard>

            <BrutalCard headerTitle="Account BYOK // Vault">
              <View style={styles.itemBody}>
                <Text style={[styles.label, { color: theme.textDim }]}>Saved key</Text>
                <Text style={[styles.savedKey, { color: theme.accent, fontFamily: Typography.fonts.mono }]}>
                  {describeAccountKey(snapshot)}
                </Text>

                <TextInput
                  value={accountKeyInput}
                  onChangeText={setAccountKeyInput}
                  placeholder="Save a Groq key to your account vault"
                  placeholderTextColor={theme.textDim}
                  secureTextEntry
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                />

                <View style={styles.actionRow}>
                  <BrutalButton onPress={() => void handleSaveAccountKey()} title={isSavingAccountKey ? 'Saving...' : 'Save to account'} disabled={isSavingAccountKey || isDeletingAccountKey} style={{ flex: 1 }} />
                  <BrutalButton onPress={() => void handleDeleteAccountKey()} title={isDeletingAccountKey ? 'Deleting...' : 'Delete'} variant="danger" disabled={isSavingAccountKey || isDeletingAccountKey} />
                </View>

                <Text style={[styles.statusMsg, { color: theme.textDim }]}>
                  Stored encrypted on the backend and used only for signed-in BYOK processing.
                </Text>
              </View>
            </BrutalCard>
          </>
        )}

        <BrutalCard headerTitle={accountSession ? 'Device fallback // Optional' : 'Local BYOK // Device key'}>
          <View style={styles.itemBody}>
            <Text style={[styles.statusMsg, { color: theme.textDim }]}> 
              {accountSession
                ? 'Signed-in recordings use your account mode above. Device BYOK is hidden because it is only a local fallback.'
                : 'Save a device-only Groq key here if you want to record without signing in.'}
            </Text>

            {accountSession ? (
              <BrutalButton
                onPress={() => setShowDeviceFallback((value) => !value)}
                title={showDeviceFallback ? 'Hide fallback key options' : 'Show fallback key options'}
                variant="outline"
                style={{ width: '100%' }}
              />
            ) : null}

            {showLocalFallbackControls ? (
              <>
                <Text style={[styles.label, { color: theme.textDim }]}>Saved key</Text>
                <Text selectable style={[styles.savedKey, { color: theme.accent, fontFamily: Typography.fonts.mono }]}> 
                  {savedKeyLabel}
                </Text>

                <TextInput
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="Enter your device-only Groq key"
                  placeholderTextColor={theme.textDim}
                  secureTextEntry
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                />

                <View style={styles.actionRow}>
                  <BrutalButton onPress={() => void saveLocalKey()} title={isSavingLocalKey ? 'Saving...' : 'Save key'} disabled={isSavingLocalKey || isClearingLocalKey} style={{ flex: 1 }} />
                  <BrutalButton onPress={() => void clearLocalKey()} title={isClearingLocalKey ? 'Clearing...' : 'Clear'} variant="danger" disabled={isSavingLocalKey || isClearingLocalKey} />
                </View>
              </>
            ) : null}
          </View>
        </BrutalCard>

        <BrutalCard headerTitle="Preferences">
          <View style={styles.itemBody}>
            <Text style={[styles.helperCopy, { color: theme.textDim }]}>
              {accountSession ? 'These settings sync to your account.' : 'These settings stay local until you sign in.'}
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Refine Transcript</Text>
                <Text style={[styles.settingDesc, { color: theme.textDim }]}>Remove filler words, fix grammar, and polish punctuation.</Text>
              </View>
              <Switch
                value={settings.enhanceText}
                onValueChange={(value) => void updateLocalAndMaybeRemoteSettings({ enhanceText: value })}
                trackColor={{ false: theme.border, true: theme.accent }}
              />
            </View>

            {settings.enhanceText && (
              <>
                <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Style</Text>
                <View style={styles.optionGrid}>
                  {PROMPT_STYLE_OPTIONS.map((option) => (
                    <BrutalButton
                      key={option.value}
                      onPress={() => void updateLocalAndMaybeRemoteSettings({ promptStyle: option.value })}
                      title={option.label}
                      variant={settings.promptStyle === option.value ? 'primary' : 'outline'}
                      small
                    />
                  ))}
                </View>

                <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.md }]}>Custom Prompt</Text>
                <TextInput
                  value={customPromptDraft}
                  onChangeText={setCustomPromptDraft}
                  onEndEditing={() => void saveCustomPrompt()}
                  multiline
                  placeholder="Optional override. Leave blank to use the selected style preset."
                  placeholderTextColor={theme.textDim}
                  style={[
                    styles.textarea,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                />
                <Text style={[styles.helperCopy, { color: theme.textDim }]}>Blank means the selected style preset stays in control.</Text>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Transcription Model</Text>
            <View style={styles.optionGrid}>
              {MODEL_OPTIONS.map((modelOption) => (
                <BrutalButton
                  key={modelOption.value}
                  onPress={() => void updateLocalAndMaybeRemoteSettings({ model: modelOption.value })}
                  title={modelOption.label}
                  variant={settings.model === modelOption.value ? 'primary' : 'outline'}
                  small
                />
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Language</Text>
            <View style={styles.optionGrid}>
              {LANGUAGE_OPTIONS.map((language) => (
                <BrutalButton
                  key={language.value}
                  onPress={() => void updateLocalAndMaybeRemoteSettings({ language: language.value })}
                  title={language.label}
                  variant={settings.language === language.value ? 'primary' : 'outline'}
                  small
                />
              ))}
            </View>
          </View>
        </BrutalCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  kanjiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanji: { fontSize: width * 0.8 },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.xl,
  },
  banner: {
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  itemBody: { gap: Spacing.md },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  subLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  savedKey: { fontSize: Typography.sizes.md, fontWeight: '700' },
  input: {
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.mono,
    borderRadius: 2,
  },
  textarea: {
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.mono,
    borderRadius: 2,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  metaRow: { gap: Spacing.xs },
  accountValue: { fontSize: Typography.sizes.md, fontWeight: '700' },
  statusMsg: { fontSize: Typography.sizes.xs, lineHeight: 18 },
  helperCopy: { fontSize: Typography.sizes.xs, lineHeight: 18 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  settingLabel: { fontSize: Typography.sizes.md, fontWeight: '700' },
  settingDesc: { fontSize: Typography.sizes.xs, marginTop: 2, lineHeight: 18 },
  divider: {
    height: 1,
    backgroundColor: 'transparent',
    marginVertical: Spacing.xs,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  settingText: { flex: 1 },
});
