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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { normalizeAccountApiError, type AccountMode, type AccountSnapshot } from '../src/api/account-client';
import {
  deleteAccountGroqKey,
  pushAccountMode,
  pushAccountSettings,
  refreshStoredAccountSnapshot,
  saveAccountGroqKey,
  signOutStoredAccount,
} from '../src/account/account-service';
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

function describeManaged(snapshot: AccountSnapshot | null) {
  const managed = snapshot?.capabilities.managed;
  if (!managed) {
    return 'Managed mode unavailable';
  }

  const usage = managed.usage;
  return `${managed.available ? 'Available' : 'Unavailable'} // ${usage.requestCountUsed}/${usage.requestCountLimit} requests // ${Math.round(usage.audioSecondsUsed)}/${Math.round(usage.audioSecondsLimit)}s`;
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
    }, [loadData])
  );

  const saveLocalKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Enter a Groq key to save it on this device.');
      return;
    }

    await saveGroqApiKey(trimmed);
    setSavedKeyLabel(maskKey(trimmed));
    setApiKeyInput('');
    setFeedbackMessage(accountSession ? 'Saved local fallback key.' : 'Saved local Groq key.');
    setErrorMessage(null);
    await notifySuccess();
  };

  const clearLocalKey = async () => {
    await deleteGroqApiKey();
    setSavedKeyLabel(maskKey(null));
    setApiKeyInput('');
    setFeedbackMessage('Cleared the local fallback key.');
    setErrorMessage(null);
    await notifyLightImpact();
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
    await signOutStoredAccount();
    setFeedbackMessage('Signed out. Local fallback remains on this device.');
    setErrorMessage(null);
    setSnapshot(null);
    setAccountSession(null);
    await notifyLightImpact();
    await loadData();
  };

  const handleRefreshAccount = async () => {
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
    }
  };

  const handleSaveAccountKey = async () => {
    const trimmed = accountKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Enter a Groq key to save it to your account vault.');
      return;
    }

    try {
      await saveAccountGroqKey(trimmed);
      setAccountKeyInput('');
      setFeedbackMessage('Saved your Groq key to the account vault.');
      setErrorMessage(null);
      await notifySuccess();
      await loadData();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not save your account Groq key.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
    }
  };

  const handleDeleteAccountKey = async () => {
    try {
      await deleteAccountGroqKey();
      setFeedbackMessage('Removed your account Groq key.');
      setErrorMessage(null);
      await notifyLightImpact();
      await loadData();
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not remove your account Groq key.').message);
      if (!await getAccountSession()) {
        setAccountSession(null);
        setSnapshot(null);
      }
    }
  };

  const handleModeChange = async (mode: AccountMode) => {
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
      }
    }
  };

  if (!settings) {
    return null;
  }

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
                  <Text style={[styles.label, { color: theme.textDim }]}>Resolved mode</Text>
                  <Text style={[styles.accountValue, { color: theme.accent }]}>
                    {snapshot?.resolvedMode.mode || accountSession.user.defaultMode}
                    {snapshot?.resolvedMode.available === false ? ' // unavailable' : ''}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Managed</Text>
                  <Text style={[styles.statusMsg, { color: theme.textDim }]}>{describeManaged(snapshot)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.label, { color: theme.textDim }]}>Account BYOK</Text>
                  <Text style={[styles.statusMsg, { color: theme.textDim }]}>{describeAccountKey(snapshot)}</Text>
                </View>

                <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Default mode</Text>
                <View style={styles.optionGrid}>
                  <BrutalButton
                    onPress={() => void handleModeChange('managed')}
                    title="Managed"
                    variant={snapshot?.user.defaultMode === 'managed' ? 'primary' : 'outline'}
                    small
                  />
                  <BrutalButton
                    onPress={() => void handleModeChange('byok')}
                    title="BYOK"
                    variant={snapshot?.user.defaultMode === 'byok' ? 'primary' : 'outline'}
                    small
                  />
                </View>

                <View style={styles.actionRow}>
                  <BrutalButton onPress={() => void handleRefreshAccount()} title="Refresh" variant="outline" style={{ flex: 1 }} />
                  <BrutalButton onPress={() => void handleSignOut()} title="Sign out" variant="danger" />
                </View>

                <Text style={[styles.helperCopy, { color: theme.textDim }]}>
                  Managed mode is server-granted in this build. No mobile purchase UI is shown here.
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
                  <BrutalButton onPress={() => void handleSaveAccountKey()} title="Save to account" style={{ flex: 1 }} />
                  <BrutalButton onPress={() => void handleDeleteAccountKey()} title="Delete" variant="danger" />
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
              <BrutalButton onPress={() => void saveLocalKey()} title="Save key" style={{ flex: 1 }} />
              <BrutalButton onPress={() => void clearLocalKey()} title="Clear" variant="danger" />
            </View>

            <Text style={[styles.statusMsg, { color: theme.textDim }]}>
              {accountSession
                ? 'Only used when you record while signed out or want a legacy local fallback.'
                : 'Stored only on this device for legacy or offline fallback.'}
            </Text>
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
