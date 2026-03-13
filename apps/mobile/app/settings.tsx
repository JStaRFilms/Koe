import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';
import {
  deleteGroqApiKey,
  getGroqApiKey,
  saveGroqApiKey,
} from '../src/storage/secure-storage';

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

  useEffect(() => {
    let cancelled = false;

    const loadKey = async () => {
      const existingKey = await getGroqApiKey();
      if (cancelled) {
        return;
      }

      setSavedKeyLabel(maskKey(existingKey));
      if (!existingKey) {
        setStatusMessage('Save a Groq API key here before you try the mobile recorder.');
      }
    };

    void loadKey();

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

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Pipeline notes</Text>
        <Text selectable style={[styles.note, { color: theme.text }]}>
          Failed mobile recordings stay available for retry until you process or explicitly discard them.
        </Text>
        <Text selectable style={[styles.note, { color: theme.text }]}>
          If the OS suspends the app while processing, Koe will surface that interruption on resume instead of pretending the job finished.
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
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
});
