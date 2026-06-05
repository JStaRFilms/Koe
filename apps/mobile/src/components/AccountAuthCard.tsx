import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { normalizeAccountApiError, type AccountSnapshot } from '../api/account-client';
import { authenticateAccount } from '../account/account-service';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { BrutalButton } from './BrutalButton';
import { BrutalCard } from './BrutalCard';

interface AccountAuthCardProps {
  headerTitle?: string;
  initialMode?: 'signin' | 'signup';
  helperText?: string;
  onAuthenticated?: (snapshot: AccountSnapshot | null) => Promise<void> | void;
}

export function AccountAuthCard({
  headerTitle = 'Account // Sign in',
  initialMode = 'signin',
  helperText,
  onAuthenticated,
}: AccountAuthCardProps) {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage('Enter your email and password to continue.');
      return;
    }

    if (password.length < 12) {
      setErrorMessage('Use at least 12 characters for your password.');
      return;
    }

    if (mode === 'signup' && !trimmedName) {
      setErrorMessage('Add a display name to create your account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const snapshot = await authenticateAccount(mode, {
        email: trimmedEmail,
        password,
        displayName: trimmedName || undefined,
      });

      setPassword('');
      if (mode === 'signup') {
        setDisplayName('');
      }

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Optional.
      }

      await onAuthenticated?.(snapshot);
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not complete account sign-in.').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  return (
    <BrutalCard headerTitle={headerTitle}>
      <View style={styles.body}>
        <View style={styles.modeRow}>
          <BrutalButton
            onPress={() => switchMode('signin')}
            title="Sign in"
            variant={mode === 'signin' ? 'primary' : 'outline'}
            small
            style={styles.modeButton}
          />
          <BrutalButton
            onPress={() => switchMode('signup')}
            title="Create"
            variant={mode === 'signup' ? 'primary' : 'outline'}
            small
            style={styles.modeButton}
          />
        </View>

        {mode === 'signup' && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={theme.textDim}
            autoCapitalize="words"
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (12+ chars)"
          placeholderTextColor={theme.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
        />

        <BrutalButton
          onPress={() => void handleSubmit()}
          title={isSubmitting ? 'Working...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          disabled={isSubmitting}
          style={{ width: '100%' }}
        />

        <Text style={[styles.copy, { color: theme.textDim }]}>
          {helperText ||
            'Sign in once to use managed mode or save your Groq key in your account vault.'}
        </Text>

        {errorMessage ? <Text style={[styles.error, { color: theme.danger }]}>{errorMessage}</Text> : null}
      </View>
    </BrutalCard>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.mono,
    borderRadius: 2,
  },
  copy: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  error: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    fontWeight: '700',
  },
});
