import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';
import {
  deleteGroqApiKey,
  getGroqApiKey,
  saveGroqApiKey,
} from '../src/storage/secure-storage';
import { loadAppSettings, saveAppSettings, type AppSettings } from '../src/storage/settings-storage';

const PROMPT_STYLE_OPTIONS = [
  { label: 'Clean', value: 'Clean' },
  { label: 'Formal', value: 'Formal' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Concise', value: 'Concise' },
] as const;

const LANGUAGE_OPTIONS = [
  { label: 'EN', value: 'en' },
  { label: 'Auto', value: 'auto' },
  { label: 'ES', value: 'es' },
  { label: 'FR', value: 'fr' },
  { label: 'DE', value: 'de' },
] as const;

function maskKey(value: string | null): string {
  if (!value) {
    return 'No key saved';
  }

  if (value.length <= 8) {
    return 'Saved securely';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyLabel, setSavedKeyLabel] = useState('Loading...');
  const [statusMessage, setStatusMessage] = useState('Your Groq key stays on-device in secure storage.');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const [existingKey, loadedSettings] = await Promise.all([
        getGroqApiKey(),
        loadAppSettings()
      ]);
      
      if (cancelled) {
        return;
      }

      setSavedKeyLabel(maskKey(existingKey));
      setSettings(loadedSettings);
      
      if (!existingKey) {
        setStatusMessage('Save a Groq API key here before you try the mobile recorder.');
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setStatusMessage('Enter a Groq API key before saving.');
      return;
    }

    await saveGroqApiKey(trimmed);
    setSavedKeyLabel(maskKey(trimmed));
    setApiKeyInput('');
    setStatusMessage('Groq API key saved securely on this device.');
  };

  const clearKey = async () => {
    await deleteGroqApiKey();
    setSavedKeyLabel(maskKey(null));
    setApiKeyInput('');
    setStatusMessage('Saved Groq API key removed from secure storage.');
  };

  const updateSetting = async (key: keyof AppSettings, value: string | boolean) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveAppSettings(updated);
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textMuted }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>BYOK</Text>
        <Text style={[styles.title, { color: theme.text }]}>Groq key storage</Text>
        <Text selectable style={[styles.body, { color: theme.textMuted }]}>
          Mobile V1 sends audio straight to Groq with your locally stored key. Nothing is proxied through a Koe backend.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Saved key</Text>
        <Text selectable style={[styles.savedKey, { color: theme.text }]}>{savedKeyLabel}</Text>

        <TextInput
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="Paste your Groq API key"
          placeholderTextColor={theme.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={saveKey}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.background }]}>Save key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={clearKey}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        <Text selectable style={[styles.statusMessage, { color: theme.textMuted }]}>
          {statusMessage}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>AI Enhancement</Text>
            <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Clean up filler words and grammar</Text>
          </View>
          <Switch
            value={settings.enhanceText}
            onValueChange={(val) => updateSetting('enhanceText', val)}
            trackColor={{ false: theme.border, true: theme.accent }}
          />
        </View>

        {settings.enhanceText && (
          <>
            <View style={styles.divider} />
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 4 }]}>Prompt Style</Text>
            <View style={styles.optionGrid}>
              {PROMPT_STYLE_OPTIONS.map((style) => (
                <TouchableOpacity
                  key={style.value}
                  onPress={() => updateSetting('promptStyle', style.value)}
                  style={[
                    styles.optionButton,
                    { borderColor: theme.border },
                    settings.promptStyle === style.value && { backgroundColor: theme.accentDim, borderColor: theme.accent }
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    { color: theme.textMuted },
                    settings.promptStyle === style.value && { color: theme.accent, fontWeight: '700' }
                  ]}>
                    {style.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.divider} />
        <Text style={[styles.label, { color: theme.textMuted, marginBottom: 4 }]}>Transcription Language</Text>
        <View style={styles.optionGrid}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              onPress={() => updateSetting('language', lang.value)}
              style={[
                styles.optionButton,
                { borderColor: theme.border },
                settings.language === lang.value && { backgroundColor: theme.accentDim, borderColor: theme.accent }
              ]}
            >
              <Text style={[
                styles.optionText,
                { color: theme.textMuted },
                settings.language === lang.value && { color: theme.accent, fontWeight: '700' }
              ]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Pipeline notes</Text>
        <Text selectable style={[styles.note, { color: theme.text }]}>
          Failed mobile recordings stay available for retry until you process or explicitly discard them.
        </Text>
        <Text selectable style={[styles.note, { color: theme.text }]}>
          If the OS suspends the app while processing, Koe will surface that interruption on resume.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  savedKey: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minWidth: 88,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
});
