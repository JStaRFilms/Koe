import { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';

export default function RecorderScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const [state, setState] = useState<RecorderState>('idle');
  const stateMeta = RECORDER_STATES[state];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Recorder shell</Text>
        <Text style={[styles.title, { color: theme.text }]}>{stateMeta.headline}</Text>
        <Text selectable style={[styles.subtitle, { color: theme.textMuted }]}>
          {stateMeta.description}
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.statusLabel, { color: stateMeta.toneColor }]}>
          {stateMeta.badge}
        </Text>
        <Text selectable style={[styles.statusCopy, { color: theme.text }]}>
          {stateMeta.detail}
        </Text>
      </View>

      <View style={styles.recorderContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setState(NEXT_STATE[state])}
          style={[
            styles.recordButton,
            { backgroundColor: stateMeta.ringColor, borderColor: stateMeta.toneColor }
          ]}
        >
          <View style={[styles.recordButtonInner, { backgroundColor: stateMeta.toneColor }]}>
            <Text style={[styles.recordGlyph, { color: theme.background }]}>●</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.statusText, { color: theme.text }]}>
          {stateMeta.actionLabel}
        </Text>
        <Text selectable style={[styles.helperText, { color: theme.textMuted }]}>
          Tap the recorder to cycle through the shell states Task 4 will wire to real audio behavior.
        </Text>
      </View>

      <View style={styles.stateRow}>
        {STATE_ORDER.map((key) => {
          const option = RECORDER_STATES[key];
          const isActive = key === state;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              onPress={() => setState(key)}
              style={[
                styles.stateChip,
                {
                  backgroundColor: isActive ? option.ringColor : theme.surface,
                  borderColor: isActive ? option.toneColor : theme.border,
                }
              ]}
            >
              <Text
                style={[
                  styles.stateChipText,
                  { color: isActive ? option.toneColor : theme.textMuted }
                ]}
              >
                {option.badge}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text selectable style={[styles.infoText, { color: theme.textMuted }]}>
            Routes, shell states, and clipboard-first messaging are ready. Recording, retries, and provider calls stay for Task 4.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

type RecorderState = 'idle' | 'recording' | 'processing' | 'copied' | 'error';

const STATE_ORDER: RecorderState[] = ['idle', 'recording', 'processing', 'copied', 'error'];

const NEXT_STATE: Record<RecorderState, RecorderState> = {
  idle: 'recording',
  recording: 'processing',
  processing: 'copied',
  copied: 'error',
  error: 'idle',
};

const RECORDER_STATES: Record<RecorderState, {
  badge: string;
  headline: string;
  description: string;
  detail: string;
  actionLabel: string;
  toneColor: string;
  ringColor: string;
}> = {
  idle: {
    badge: 'Idle',
    headline: 'Ready when you are',
    description: 'A recorder-first shell with room for live waveform, timers, and retry controls.',
    detail: 'Nothing is recording yet. The next task will connect this screen to real microphone capture.',
    actionLabel: 'Tap to start recording',
    toneColor: Colors.dark.accent,
    ringColor: Colors.dark.accentGlow,
  },
  recording: {
    badge: 'Recording',
    headline: 'Listening in the foreground',
    description: 'The shell reserves a clear active state for live capture, elapsed time, and stop controls.',
    detail: 'Audio is being captured and chunked locally before provider processing.',
    actionLabel: 'Tap to stop and process',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
  processing: {
    badge: 'Processing',
    headline: 'Finishing the transcript',
    description: 'This is where chunk progress, retries, and final refinement feedback will surface.',
    detail: 'Queued chunks are transcribing now. Keep the app open while the clipboard result is prepared.',
    actionLabel: 'Processing queued chunks',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  copied: {
    badge: 'Copied',
    headline: 'Clipboard-first completion',
    description: 'The product promise is explicit here: finish transcription, then hand off the text cleanly.',
    detail: 'Transcript copied successfully. Task 5 can layer in richer handoff and history affordances.',
    actionLabel: 'Tap to record again',
    toneColor: Colors.dark.success,
    ringColor: Colors.dark.successGlow,
  },
  error: {
    badge: 'Error',
    headline: 'Graceful failure path',
    description: 'The shell already has a place for retry guidance before any real provider errors are wired in.',
    detail: 'Something failed. Retry copy and unsent-segment recovery will plug into this surface in the next task.',
    actionLabel: 'Tap to reset the shell',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
};

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
  recordGlyph: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 48,
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
  stateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stateChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stateChipText: {
    fontSize: 13,
    fontWeight: '700',
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
