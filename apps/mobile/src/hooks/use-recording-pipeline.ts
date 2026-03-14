import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { UsageStats } from '@koe/core';
import { mobileProvider } from '../providers/mobile-provider';
import {
  cancelRecorder,
  DEFAULT_RECORDING_OPTIONS,
  requestMicrophonePermission,
  startRecorder,
  stopRecorder,
} from '../recording/recorder-controller';
import {
  clearRetryState,
  loadRetryState,
  loadUsageTracker,
  markRetryStateInterrupted,
  saveRetryState,
  saveUsageTracker,
  type PersistedRetryState,
} from '../storage/pipeline-storage';
import { getGroqApiKey } from '../storage/secure-storage';
import { loadAppSettings } from '../storage/settings-storage';
import { addToHistory } from '../storage/history-storage';

export type RecordingStage = 'idle' | 'recording' | 'processing' | 'copied' | 'empty' | 'error';

export interface PipelineStatus {
  stage: RecordingStage;
  label: string;
  transcript?: string;
  error?: string;
  progress?: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred.';
}

export function useRecordingPipeline() {
  const recorder = useAudioRecorder(DEFAULT_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder);

  const [status, setStatusState] = useState<PipelineStatus>({
    stage: 'idle',
    label: 'Ready to record',
  });
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [hasPendingRetry, setHasPendingRetry] = useState(false);

  const statusRef = useRef<PipelineStatus>(status);
  const retryStateRef = useRef<PersistedRetryState | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const setStatus = useCallback((next: PipelineStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const scheduleReturnToIdle = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      if (statusRef.current.stage === 'copied' || statusRef.current.stage === 'empty') {
        setStatus({
          stage: 'idle',
          label: 'Ready to record',
        });
      }
    }, 3200);
  }, [clearResetTimer, setStatus]);

  const hydrateRetryBanner = useCallback((retryState: PersistedRetryState) => {
    retryStateRef.current = retryState;
    setHasPendingRetry(true);
    setStatus({
      stage: 'error',
      label: retryState.interrupted ? 'Saved recording interrupted' : 'Saved recording needs retry',
      error:
        retryState.lastError ??
        'Your previous recording was preserved locally. Retry it before starting a new session.',
      transcript: retryState.rawText ?? undefined,
      progress: 0,
    });
  }, [setStatus]);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      const [tracker, retryState] = await Promise.all([loadUsageTracker(), loadRetryState()]);
      if (cancelled) {
        return;
      }

      setUsageStats(tracker.getStats());

      if (retryState) {
        hydrateRetryBanner(retryState);
      }
    };

    void loadState();

    return () => {
      cancelled = true;
      clearResetTimer();
    };
  }, [clearResetTimer, hydrateRetryBanner]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState !== 'active' && statusRef.current.stage === 'processing' && retryStateRef.current) {
        void markRetryStateInterrupted();
      }

      if (
        previousAppState !== 'active' &&
        nextAppState === 'active' &&
        statusRef.current.stage === 'recording' &&
        (!recorderState.isRecording || recorderState.mediaServicesDidReset)
      ) {
        setStatus({
          stage: 'error',
          label: 'Recording interrupted',
          error: 'The OS interrupted recording before it could finish. Please record that thought again.',
          progress: 0,
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [recorderState.isRecording, recorderState.mediaServicesDidReset, setStatus]);

  const persistUsage = useCallback(async (durationMillis: number) => {
    const tracker = await loadUsageTracker();
    tracker.recordRequest(Math.max(1, Math.round(durationMillis / 1000)));
    const stats = await saveUsageTracker(tracker);
    setUsageStats(stats);
  }, []);

  const finalizeSuccess = useCallback(
    async (rawText: string, finalText: string, durationMillis: number) => {
      await Clipboard.setStringAsync(finalText);
      await persistUsage(durationMillis);
      await clearRetryState();
      
      await addToHistory({
        id: `mobile-${Date.now()}`,
        timestamp: Date.now(),
        rawText,
        refinedText: finalText !== rawText ? finalText : null,
        durationMillis,
      });

      retryStateRef.current = null;
      setHasPendingRetry(false);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics are optional; the transcript result is the real success path.
      }

      setStatus({
        stage: 'copied',
        label: 'Copied to clipboard',
        transcript: finalText,
        progress: 100,
      });
      scheduleReturnToIdle();
    },
    [persistUsage, scheduleReturnToIdle, setStatus]
  );

  const processRetryState = useCallback(
    async (retryState: PersistedRetryState) => {
      clearResetTimer();

      let currentRetryState: PersistedRetryState = {
        ...retryState,
        interrupted: false,
        lastError: null,
      };
      let rawText = currentRetryState.rawText?.trim() ?? '';

      retryStateRef.current = currentRetryState;
      setHasPendingRetry(true);
      await saveRetryState(currentRetryState);

      try {
        const settings = await loadAppSettings();
        const apiKey = await getGroqApiKey() || '';

        setStatus({
          stage: 'processing',
          label: 'Uploading audio...',
          transcript: rawText || undefined,
          progress: 18,
        });

        if (!rawText) {
          rawText = await mobileProvider.transcribeSegment(currentRetryState.audioUri, {
            apiKey,
            language: settings.language === 'auto' ? undefined : settings.language,
            onStage: (nextStage) =>
              setStatus({
                stage: 'processing',
                label: nextStage.label,
                transcript: rawText || undefined,
                progress: nextStage.progress ?? 35,
              }),
          });
        }

        if (!rawText.trim()) {
          await clearRetryState();
          retryStateRef.current = null;
          setHasPendingRetry(false);
          setStatus({
            stage: 'empty',
            label: 'No speech detected',
            progress: 100,
          });
          scheduleReturnToIdle();
          return;
        }

        currentRetryState = {
          ...currentRetryState,
          rawText,
          interrupted: false,
          lastError: null,
        };
        retryStateRef.current = currentRetryState;
        await saveRetryState(currentRetryState);

        const refinedText = settings.enhanceText 
          ? await mobileProvider.refineTranscript(rawText, {
            apiKey,
            promptStyle: settings.promptStyle,
            model: settings.model,
            onStage: (nextStage) =>
              setStatus({
                stage: 'processing',
                label: nextStage.label,
                transcript: rawText,
                progress: nextStage.progress ?? 82,
              }),
          })
          : rawText;

        await finalizeSuccess(rawText, refinedText, currentRetryState.durationMillis);
      } catch (error) {
        const message = getErrorMessage(error);
        const failedState: PersistedRetryState = {
          ...currentRetryState,
          rawText: rawText || currentRetryState.rawText || null,
          lastError: message,
          interrupted: false,
        };

        retryStateRef.current = failedState;
        setHasPendingRetry(true);
        await saveRetryState(failedState);

        setStatus({
          stage: 'error',
          label: 'Processing failed',
          error: message,
          transcript: failedState.rawText ?? undefined,
          progress: 0,
        });
      }
    },
    [clearResetTimer, finalizeSuccess, scheduleReturnToIdle, setStatus]
  );

  const startRecordingSession = useCallback(async () => {
    clearResetTimer();

    if (retryStateRef.current) {
      setStatus({
        stage: 'error',
        label: 'Resolve saved recording first',
        error: 'Retry or discard the saved failed recording before starting a new one.',
        transcript: retryStateRef.current.rawText ?? undefined,
        progress: 0,
      });
      return;
    }

    const apiKey = await getGroqApiKey();
    if (!apiKey?.trim()) {
      setStatus({
        stage: 'error',
        label: 'API key required',
        error: 'Open Settings and save your API key before recording.',
        progress: 0,
      });
      return;
    }

    const permission = await requestMicrophonePermission();
    if (!permission.granted) {
      setStatus({
        stage: 'error',
        label: 'Microphone blocked',
        error: 'Microphone permission is required to capture audio on mobile.',
        progress: 0,
      });
      return;
    }

    try {
      await startRecorder(recorder);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Optional.
      }
      setStatus({
        stage: 'recording',
        label: 'Listening...',
        progress: 0,
      });
    } catch (error) {
      setStatus({
        stage: 'error',
        label: 'Failed to start recording',
        error: getErrorMessage(error),
        progress: 0,
      });
    }
  }, [clearResetTimer, recorder, setStatus]);

  const stopAndProcess = useCallback(async () => {
    try {
      const completed = await stopRecorder(recorder);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Optional.
      }
      if (!completed.uri) {
        setStatus({
          stage: 'empty',
          label: 'Nothing was captured',
          progress: 100,
        });
        scheduleReturnToIdle();
        return;
      }

      const retryState: PersistedRetryState = {
        sessionId: `mobile-${Date.now()}`,
        audioUri: completed.uri,
        durationMillis: completed.durationMillis,
        createdAt: Date.now(),
        interrupted: false,
      };

      retryStateRef.current = retryState;
      setHasPendingRetry(true);
      await saveRetryState(retryState);
      await processRetryState(retryState);
    } catch (error) {
      setStatus({
        stage: 'error',
        label: 'Failed to stop recording',
        error: getErrorMessage(error),
        progress: 0,
      });
    }
  }, [processRetryState, recorder, scheduleReturnToIdle, setStatus]);

  const retryLastSession = useCallback(async () => {
    const retryState = retryStateRef.current ?? (await loadRetryState());
    if (!retryState) {
      setHasPendingRetry(false);
      setStatus({
        stage: 'idle',
        label: 'Ready to record',
      });
      return;
    }

    await processRetryState(retryState);
  }, [processRetryState, setStatus]);

  const discardRetrySession = useCallback(async () => {
    await clearRetryState();
    retryStateRef.current = null;
    setHasPendingRetry(false);
    setStatus({
      stage: 'idle',
      label: 'Ready to record',
    });
  }, [setStatus]);

  const cancelActiveRecording = useCallback(async () => {
    await cancelRecorder(recorder);
    setStatus({
      stage: 'idle',
      label: 'Ready to record',
    });
  }, [recorder, setStatus]);

  const reset = useCallback(() => {
    clearResetTimer();
    if (retryStateRef.current) {
      hydrateRetryBanner(retryStateRef.current);
      return;
    }

    setStatus({
      stage: 'idle',
      label: 'Ready to record',
    });
  }, [clearResetTimer, hydrateRetryBanner, setStatus]);

  return {
    status,
    usageStats,
    hasPendingRetry,
    isRecording: recorderState.isRecording,
    durationMillis: recorderState.durationMillis,
    startRecording: startRecordingSession,
    stopAndProcess,
    retryLastSession,
    discardRetrySession,
    cancelActiveRecording,
    reset,
  };
}
