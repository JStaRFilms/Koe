import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';
import { useRecordingPipeline } from '../src/hooks/use-recording-pipeline';

type ScreenStage = 'idle' | 'recording' | 'processing' | 'copied' | 'empty' | 'error';

const RECORDER_STATES: Record<
  ScreenStage,
  {
    headline: string;
    description: string;
    detail: string;
    actionLabel: string;
    toneColor: string;
    ringColor: string;
  }
> = {
  idle: {
    headline: 'Ready when you are',
    description: 'Manual start and stop recording is active. Save your Groq key in Settings, then tap to begin.',
    detail: 'Your transcript will be copied to the clipboard after Groq transcription and refinement complete.',
    actionLabel: 'Tap to start recording',
    toneColor: Colors.dark.accent,
    ringColor: Colors.dark.accentGlow,
  },
  recording: {
    headline: 'Listening...',
    description: 'Koe is capturing a single manual recording session with interruption-safe state.',
    detail: 'Tap again to stop. If the OS interrupts recording, Koe will surface that failure when you return.',
    actionLabel: 'Tap to stop and process',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
  processing: {
    headline: 'Processing through Groq',
    description: 'The saved recording is being transcribed and refined. Retry data stays on-device if something fails.',
    detail: 'This path favors reliability over live partial transcription in V1.',
    actionLabel: 'Processing...',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  copied: {
    headline: 'Copied to clipboard',
    description: 'Your refined transcript is ready to paste anywhere on mobile.',
    detail: 'A successful run clears the saved retry state and updates local usage stats.',
    actionLabel: 'Tap to record again',
    toneColor: Colors.dark.success,
    ringColor: Colors.dark.successGlow,
  },
  empty: {
    headline: 'No speech detected',
    description: 'The recording finished, but Groq did not return spoken text.',
    detail: 'Try again in a quieter environment or speak closer to the microphone.',
    actionLabel: 'Tap to try again',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  error: {
    headline: 'Recovery path available',
    description: 'Koe keeps failed work available for retry instead of discarding captured speech.',
    detail: 'Retry the saved recording or discard it intentionally before starting a new session.',
    actionLabel: 'Retry saved recording',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
};

export default function RecorderScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const {
    status,
    usageStats,
    hasPendingRetry,
    isRecording,
    durationMillis,
    startRecording,
    stopAndProcess,
    retryLastSession,
    discardRetrySession,
    cancelActiveRecording,
    reset,
  } = useRecordingPipeline();

  const stage = status.stage as ScreenStage;
  const stateMeta = RECORDER_STATES[stage];

  const handlePrimaryPress = async () => {
    if (status.stage === 'recording') {
      await stopAndProcess();
      return;
    }

    if (status.stage === 'processing') {
      return;
    }

    if (status.stage === 'error' && hasPendingRetry) {
      await retryLastSession();
      return;
    }

    if (status.stage === 'error') {
      reset();
      return;
    }

    await startRecording();
  };

  const durationSeconds = Math.max(0, Math.round(durationMillis / 1000));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Task 4 pipeline</Text>
        <Text style={[styles.title, { color: theme.text }]}>{stateMeta.headline}</Text>
        <Text selectable style={[styles.subtitle, { color: theme.textMuted }]}>
          {stateMeta.description}
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.statusLabel, { color: stateMeta.toneColor }]}>{status.label}</Text>
        <Text selectable style={[styles.statusCopy, { color: theme.text }]}>
          {status.error || status.transcript || stateMeta.detail}
        </Text>
        {typeof status.progress === 'number' && (
          <Text selectable style={[styles.progressText, { color: theme.textMuted }]}>
            Progress: {status.progress}%
          </Text>
        )}
      </View>

      <View style={styles.recorderContainer}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handlePrimaryPress}
          disabled={status.stage === 'processing'}
          style={[
            styles.recordButton,
            {
              backgroundColor: stateMeta.ringColor,
              borderColor: stateMeta.toneColor,
              opacity: status.stage === 'processing' ? 0.55 : 1,
            },
          ]}
        >
          <View style={[styles.recordButtonInner, { backgroundColor: stateMeta.toneColor }]}>
            {status.stage === 'recording' ? (
              <View style={[styles.stopSquare, { backgroundColor: theme.background }]} />
            ) : status.stage === 'processing' ? (
              <Text style={[styles.recordGlyph, { color: theme.background }]}>...</Text>
            ) : status.stage === 'error' && hasPendingRetry ? (
              <Text style={[styles.recordGlyph, { color: theme.background }]}>R</Text>
            ) : (
              <Text style={[styles.recordGlyph, { color: theme.background }]}>O</Text>
            )}
          </View>
        </TouchableOpacity>

        <Text style={[styles.statusText, { color: theme.text }]}>{stateMeta.actionLabel}</Text>
        <Text selectable style={[styles.helperText, { color: theme.textMuted }]}>
          {isRecording
            ? `Recording now. Duration: ${durationSeconds}s`
            : hasPendingRetry
              ? 'A failed recording is saved locally and ready to retry.'
              : 'Clipboard-first output. No backend proxy involved.'}
        </Text>

        {(isRecording || hasPendingRetry) && (
          <View style={styles.secondaryActions}>
            {isRecording && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={cancelActiveRecording}
                style={[styles.secondaryButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel recording</Text>
              </TouchableOpacity>
            )}
            {hasPendingRetry && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={discardRetrySession}
                style={[styles.secondaryButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Discard saved recording</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text selectable style={[styles.infoText, { color: theme.textMuted }]}>
            {usageStats
              ? `Today: ${usageStats.requestCount} requests, ${usageStats.audioSecondsUsed}s processed.`
              : 'No usage recorded yet.'}
          </Text>
        </View>
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
    gap: Spacing.xl,
  },
  hero: {
    gap: Spacing.sm,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  recorderContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  recordGlyph: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondaryActions: {
    width: '100%',
    gap: Spacing.sm,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
