import { useState } from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { normalizeAccountApiError, type AccountSnapshot } from '../api/account-client';
import { authenticateAccount, requestAccountPasswordReset } from '../account/account-service';
import { Colors } from '../constants/Theme';
import { BrutalButton } from './BrutalButton';
import { BrutalCard } from './BrutalCard';
import { styles } from './AccountAuthCard.styles';

interface AccountAuthCardProps {
  headerTitle?: string;
  initialMode?: 'signin' | 'signup';
  helperText?: string;
  onAuthenticated?: (snapshot: AccountSnapshot | null) => Promise<void> | void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export function AccountAuthCard({
  headerTitle = 'Account // Sign in',
  initialMode = 'signin',
  helperText,
  onAuthenticated,
}: AccountAuthCardProps) {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail) {
      setErrorMessage('Enter your email address first.');
      return;
    }

    if (mode !== 'reset' && !password.trim()) {
      setErrorMessage('Enter your password to continue.');
      return;
    }

    if (mode !== 'reset' && password.length < 12) {
      setErrorMessage('Use at least 12 characters for your password.');
      return;
    }

    if (mode === 'signup' && !trimmedName) {
      setErrorMessage('Add a display name to create your account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'reset') {
        await requestAccountPasswordReset(trimmedEmail);
        setPassword('');
        setSuccessMessage('If that email has a Koe account, a reset link is on the way.');
        setMode('signin');
      } else {
        const snapshot = await authenticateAccount(mode, {
          email: trimmedEmail,
          password,
          displayName: trimmedName || undefined,
        });

        setPassword('');
        if (mode === 'signup') {
          setDisplayName('');
        }

        await onAuthenticated?.(snapshot);
      }

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Optional.
      }
    } catch (error) {
      setErrorMessage(normalizeAccountApiError(error, 'Could not complete account sign-in.').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const submitTitle = isSubmitting
    ? 'Working...'
    : mode === 'reset'
      ? 'Send reset email'
      : mode === 'signup'
        ? 'Create account'
        : 'Sign in';

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
          <BrutalButton
            onPress={() => switchMode('reset')}
            title="Reset"
            variant={mode === 'reset' ? 'primary' : 'outline'}
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

        {mode !== 'reset' && (
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
        )}

        <BrutalButton
          onPress={() => void handleSubmit()}
          title={submitTitle}
          disabled={isSubmitting}
          style={{ width: '100%' }}
        />

        <Text style={[styles.copy, { color: theme.textDim }]}>
          {mode === 'reset'
            ? 'Koe sends reset links by email. Complete the reset in the browser, then sign in here again.'
            : helperText ||
            'Sign in once to use managed mode or save your Groq key in your account vault.'}
        </Text>

        {successMessage ? <Text style={[styles.success, { color: theme.success }]}>{successMessage}</Text> : null}
        {errorMessage ? <Text style={[styles.error, { color: theme.danger }]}>{errorMessage}</Text> : null}
      </View>
    </BrutalCard>
  );
}

