import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import { RECORDER_STATES, type ScreenStage } from '../src/constants/RecorderStates';
import { useRecordingPipeline } from '../src/hooks/use-recording-pipeline';
import { StatusCard } from '../src/components/StatusCard';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalButton } from '../src/components/BrutalButton';

const { width } = Dimensions.get('window');

export default function RecorderScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const {
    status,
    usageStats,
    hasPendingRetry,
    isRecording,
    durationMillis,
    voiceLevels,
    startRecording,
    stopAndProcess,
    retryLastSession,
    discardRetrySession,
    cancelActiveRecording,
    reset,
  } = useRecordingPipeline();

  const stage = status.stage as ScreenStage;
  const stateMeta = RECORDER_STATES[stage];
  const waveBars = useRef(Array.from({ length: 8 }, () => new Animated.Value(8))).current;
  const sweepValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel(
      waveBars.map((bar, index) =>
        Animated.timing(bar, {
          toValue: 8 + (voiceLevels[index] ?? 0) * 58,
          duration: 110,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [voiceLevels, waveBars]);

  useEffect(() => {
    if (status.stage === 'recording' || status.stage === 'processing') {
      Animated.loop(
        Animated.timing(sweepValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      return;
    }

    sweepValue.stopAnimation();
    sweepValue.setValue(0);
  }, [status.stage, sweepValue]);

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
    <View style={styles.outer}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.kanjiContainer} pointerEvents="none">
        <Text style={[styles.kanji, { color: theme.border, opacity: 0.15 }]}>
          {'\u58F0'}
        </Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={[styles.badge, { borderColor: theme.border }]}>
            <Text style={[styles.badgeText, { color: theme.textMuted }]}>
              {status.stage === 'recording'
                ? 'Live'
                : status.stage === 'processing'
                  ? 'Working'
                  : 'Ready'}
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.text, fontFamily: Typography.fonts.deco }]}>
            Koe <Text style={{ color: theme.accent }}>{'\u58F0'}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Your voice, everywhere.
          </Text>
        </View>

        <View style={styles.visualizationContainer}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.signalSweep,
              {
                backgroundColor: theme.accent,
                opacity: status.stage === 'processing' ? 0.16 : 0.11,
                transform: [
                  {
                    translateX: sweepValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width * 0.7, width * 0.7],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.waveformContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: theme.accent,
                    height: waveBars[index - 1],
                    opacity:
                      status.stage === 'recording'
                        ? 0.92
                        : status.stage === 'processing'
                          ? 0.42
                          : 0.14,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <StatusCard
          label={isRecording ? `Recording ${durationSeconds}s` : status.label}
          detail={status.error || status.transcript || stateMeta.detail}
          toneColor={stateMeta.toneColor}
          progress={status.progress}
          stream={status.stage === 'processing'}
        />

        <View style={styles.actionSection}>
          <BrutalButton
            onPress={handlePrimaryPress}
            title={stateMeta.actionLabel}
            variant={status.stage === 'recording' ? 'danger' : 'primary'}
            disabled={status.stage === 'processing'}
            style={{ width: '100%' }}
          />

          <View style={styles.helperSection}>
            <Text style={[styles.helperText, { color: theme.textMuted }]}>
              {status.stage === 'recording'
                ? 'Listening. Tap again to stop.'
                : status.stage === 'processing'
                  ? 'Refining your recording into text.'
                  : 'Captured audio is refined and copied to your clipboard.'}
            </Text>
          </View>

          {(isRecording || hasPendingRetry) && (
            <View style={styles.secondaryActions}>
              {isRecording && (
                <BrutalButton
                  onPress={cancelActiveRecording}
                  title="Cancel"
                  variant="outline"
                  style={{ width: '100%' }}
                />
              )}
              {hasPendingRetry && (
                <BrutalButton
                  onPress={discardRetrySession}
                  title="Discard saved session"
                  variant="danger"
                  style={{ width: '100%' }}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.usageText, { color: theme.textDim }]}>
            {usageStats
              ? `Today: ${usageStats.requestCount} sessions // ${usageStats.audioSecondsUsed}s total`
              : 'Usage updates after your first capture.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
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
  kanji: {
    fontSize: width * 1.2,
    fontFamily: 'System',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    letterSpacing: 1,
  },
  visualizationContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signalSweep: {
    position: 'absolute',
    width: width * 0.42,
    height: 72,
    borderRadius: 18,
    top: 24,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  actionSection: {
    paddingTop: Spacing.md,
  },
  helperSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  helperText: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
  secondaryActions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  usageText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
});
