import { useEffect, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import { deleteGroqApiKey, getGroqApiKey, saveGroqApiKey } from '../src/storage/secure-storage';
import { loadAppSettings, saveAppSettings, type AppSettings } from '../src/storage/settings-storage';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalCard } from '../src/components/BrutalCard';
import { BrutalButton } from '../src/components/BrutalButton';

const { width } = Dimensions.get('window');

const PROMPT_STYLE_OPTIONS = [
  { label: 'Clean', value: 'Clean' },
  { label: 'Formal', value: 'Formal' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Concise', value: 'Concise' },
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

export default function SettingsScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyLabel, setSavedKeyLabel] = useState('Loading...');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const [existingKey, loadedSettings] = await Promise.all([getGroqApiKey(), loadAppSettings()]);
      if (cancelled) {
        return;
      }

      setSavedKeyLabel(maskKey(existingKey));
      setSettings(loadedSettings);
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      return;
    }

    await saveGroqApiKey(trimmed);
    setSavedKeyLabel(maskKey(trimmed));
    setApiKeyInput('');
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics are optional.
    }
  };

  const clearKey = async () => {
    await deleteGroqApiKey();
    setSavedKeyLabel(maskKey(null));
    setApiKeyInput('');
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics are optional.
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: string | boolean) => {
    if (!settings) {
      return;
    }

    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveAppSettings(updated);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
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
        <BrutalCard headerTitle="BYOK // API Key">
          <View style={styles.itemBody}>
            <Text style={[styles.label, { color: theme.textDim }]}>Saved key</Text>
            <Text selectable style={[styles.savedKey, { color: theme.accent, fontFamily: Typography.fonts.mono }]}>
              {savedKeyLabel}
            </Text>

            <TextInput
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Enter your Groq key"
              placeholderTextColor={theme.textDim}
              secureTextEntry
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
              ]}
            />

            <View style={styles.actionRow}>
              <BrutalButton onPress={saveKey} title="Save key" style={{ flex: 1 }} />
              <BrutalButton onPress={clearKey} title="Clear" variant="danger" />
            </View>

            <Text style={[styles.statusMsg, { color: theme.textDim }]}>
              Stored locally. Requires a valid Groq key for transcription.
            </Text>
          </View>
        </BrutalCard>

        <BrutalCard headerTitle="Preferences">
          <View style={styles.itemBody}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Refine Transcript</Text>
                <Text style={[styles.settingDesc, { color: theme.textDim }]}>
                  Remove filler words, fix grammar, and polish punctuation.
                </Text>
              </View>
              <Switch
                value={settings.enhanceText}
                onValueChange={(value) => updateSetting('enhanceText', value)}
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
                      onPress={() => updateSetting('promptStyle', option.value)}
                      title={option.label}
                      variant={settings.promptStyle === option.value ? 'primary' : 'outline'}
                      small
                    />
                  ))}
                </View>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.subLabel, { color: theme.textDim, marginTop: Spacing.sm }]}>Language</Text>
            <View style={styles.optionGrid}>
              {LANGUAGE_OPTIONS.map((language) => (
                <BrutalButton
                  key={language.value}
                  onPress={() => updateSetting('language', language.value)}
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
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  statusMsg: { fontSize: Typography.sizes.xs, lineHeight: 18 },
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
