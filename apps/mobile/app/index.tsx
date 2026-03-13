import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Animated, Easing } from 'react-native';
import { Mic, Square, Loader2, Check, RefreshCw } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Colors, Spacing } from '../src/constants/Theme';
import { RECORDER_STATES, type ScreenStage } from '../src/constants/RecorderStates';
import { useRecordingPipeline } from '../src/hooks/use-recording-pipeline';
import { StatusCard } from '../src/components/StatusCard';

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

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status.stage === 'processing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [status.stage]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePrimaryPress = async () => {
    if (status.stage === 'recording') return await stopAndProcess();
    if (status.stage === 'processing') return;
    if (status.stage === 'error' && hasPendingRetry) return await retryLastSession();
    if (status.stage === 'error') return reset();
    await startRecording();
  };

  const durationSeconds = Math.max(0, Math.round(durationMillis / 1000));

  const renderIcon = () => {
    const iconProps = { size: 42, color: theme.background };
    if (status.stage === 'recording') return <Square fill={theme.background} {...iconProps} />;
    if (status.stage === 'processing') {
      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Loader2 {...iconProps} />
        </Animated.View>
      );
    }
    if (status.stage === 'copied') return <Check {...iconProps} />;
    if (status.stage === 'error') return <RefreshCw {...iconProps} />;
    return <Mic {...iconProps} />;
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Manual Mode</Text>
        <Text style={[styles.title, { color: theme.text }]}>{stateMeta.headline}</Text>
        <Text selectable style={[styles.subtitle, { color: theme.textMuted }]}>
          {stateMeta.description}
        </Text>
      </View>

      <StatusCard 
        label={isRecording ? `${status.label} • ${durationSeconds}s` : status.label}
        detail={status.error || status.transcript || stateMeta.detail}
        toneColor={stateMeta.toneColor}
        progress={status.progress}
        theme={theme}
      />

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
              opacity: status.stage === 'processing' ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.recordButtonInner, { backgroundColor: stateMeta.toneColor }]}>
            {renderIcon()}
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
    gap: Spacing.xs,
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
  recorderContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  recordButtonInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  secondaryActions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  secondaryButton: {
    borderRadius: 16,
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
  footer: {
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
