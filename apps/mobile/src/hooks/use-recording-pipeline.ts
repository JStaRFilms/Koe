import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioRecorder, useAudioRecorderState, type RecordingStatus } from 'expo-audio';
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
  getRetryAudioUris,
  loadRetryState,
  loadUsageTracker,
  markRetryStateInterrupted,
  saveRetryState,
  saveUsageTracker,
  type PersistedRetryState,
} from '../storage/pipeline-storage';
import { getGroqApiKey } from '../storage/secure-storage';
import { addToHistory } from '../storage/history-storage';
import { loadAppSettings } from '../storage/settings-storage';

export type RecordingStage = 'idle' | 'recording' | 'processing' | 'copied' | 'empty' | 'error';

export interface PipelineStatus {
  stage: RecordingStage;
  label: string;
  transcript?: string;
  error?: string;
  progress?: number;
}

interface ActiveRecordingSession {
  sessionId: string;
  createdAt: number;
  totalDurationMillis: number;
  chunkUris: string[];
}

const CHUNK_ROTATION_MS = 20_000;
const MIN_CHUNK_DURATION_MS = 900;
const VOICE_BAR_COUNT = 8;
const VOICE_BAR_WEIGHTS = [0.36, 0.54, 0.78, 1, 1, 0.78, 0.54, 0.36];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred.';
}

function appendTranscript(existing: string, nextChunk: string): string {
  const left = existing.trim();
  const right = nextChunk.trim();

  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return `${left} ${right}`.trim();
}

function buildRetryState(
  sessionId: string,
  audioUris: string[],
  durationMillis: number,
  createdAt: number,
  rawText?: string | null
): PersistedRetryState {
  return {
    sessionId,
    audioUri: audioUris[0] ?? null,
    audioUris,
    durationMillis,
    createdAt,
    rawText: rawText ?? null,
    interrupted: false,
    lastError: null,
  };
}

function meteringToVoiceBars(metering: number | undefined, durationMillis: number, previous: number[]) {
  const normalizedMeter =
    typeof metering === 'number' ? Math.max(0, Math.min(1, (metering + 60) / 60)) : 0;
  const phase = durationMillis / 140;

  return VOICE_BAR_WEIGHTS.map((weight, index) => {
    const ripple = Math.max(0, Math.sin(phase + index * 0.85)) * normalizedMeter * 0.18;
    const floor = normalizedMeter > 0.08 ? 0.08 * weight : 0;
    const target = Math.max(floor, Math.min(1, normalizedMeter * weight + ripple));
    const current = previous[index] ?? 0;
    const eased = current + (target - current) * 0.58;
    return Math.max(0, Math.min(1, eased));
  });
}

export function useRecordingPipeline() {
  const finalRecordingRef = useRef<{ url: string | null; error: string | null }>({
    url: null,
    error: null,
  });
  const recorder = useAudioRecorder(
    DEFAULT_RECORDING_OPTIONS,
    useCallback((nextStatus: RecordingStatus) => {
      if (!nextStatus.isFinished) {
        return;
      }

      finalRecordingRef.current = {
        url: nextStatus.url,
        error: nextStatus.hasError ? nextStatus.error : null,
      };
    }, [])
  );
  const recorderState = useAudioRecorderState(recorder, 120);

  const [status, setStatusState] = useState<PipelineStatus>({
    stage: 'idle',
    label: 'Ready to record',
  });
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [hasPendingRetry, setHasPendingRetry] = useState(false);
  const [voiceLevels, setVoiceLevels] = useState<number[]>(Array.from({ length: VOICE_BAR_COUNT }, () => 0));
  const [sessionDurationMillis, setSessionDurationMillis] = useState(0);
  const [isSessionRecording, setIsSessionRecording] = useState(false);

  const statusRef = useRef<PipelineStatus>(status);
  const retryStateRef = useRef<PersistedRetryState | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationPromiseRef = useRef<Promise<void> | null>(null);
  const activeSessionRef = useRef<ActiveRecordingSession | null>(null);
  const stopRequestedRef = useRef(false);
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

  const clearChunkTimer = useCallback(() => {
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
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
      clearChunkTimer();
    };
  }, [clearChunkTimer, clearResetTimer, hydrateRetryBanner]);

  useEffect(() => {
    const activeSession = activeSessionRef.current;

    if (!recorderState.isRecording) {
      if (activeSession && statusRef.current.stage === 'recording' && !stopRequestedRef.current) {
        setSessionDurationMillis(activeSession.totalDurationMillis);
        return;
      }

      setVoiceLevels(Array.from({ length: VOICE_BAR_COUNT }, () => 0));
      return;
    }

    setSessionDurationMillis((activeSession?.totalDurationMillis ?? 0) + recorderState.durationMillis);
    setVoiceLevels((previous) =>
      meteringToVoiceBars(recorderState.metering, recorderState.durationMillis, previous)
    );
  }, [recorderState.durationMillis, recorderState.isRecording, recorderState.metering]);

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
        clearChunkTimer();
        stopRequestedRef.current = false;
        activeSessionRef.current = null;
        setIsSessionRecording(false);
        setSessionDurationMillis(0);
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
  }, [
    clearChunkTimer,
    recorderState.isRecording,
    recorderState.mediaServicesDidReset,
    setStatus,
  ]);

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
      activeSessionRef.current = null;
      stopRequestedRef.current = false;
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
      setSessionDurationMillis(0);
      setIsSessionRecording(false);
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
      let pendingAudioUris = getRetryAudioUris(currentRetryState);
      let rawText = currentRetryState.rawText?.trim() ?? '';

      retryStateRef.current = currentRetryState;
      setHasPendingRetry(true);
      await saveRetryState(currentRetryState);

      try {
        const settings = await loadAppSettings();
        const apiKey = (await getGroqApiKey()) || '';
        const totalChunkCount = pendingAudioUris.length;

        setStatus({
          stage: 'processing',
          label:
            totalChunkCount > 1
              ? `Processing recording part 1 of ${totalChunkCount}...`
              : 'Processing recording...',
          transcript: rawText || undefined,
          progress: 12,
        });

        while (pendingAudioUris.length > 0) {
          const audioUri = pendingAudioUris[0];
          const completedChunkCount = totalChunkCount - pendingAudioUris.length;
          const chunkNumber = completedChunkCount + 1;
          const chunkProgressBase = 18 + Math.round((completedChunkCount / Math.max(totalChunkCount, 1)) * 48);

          const chunkText = await mobileProvider.transcribeSegment(audioUri, {
            apiKey,
            language: settings.language === 'auto' ? undefined : settings.language,
            onStage: (nextStage) =>
              setStatus({
                stage: 'processing',
                label:
                  totalChunkCount > 1
                    ? `Processing recording part ${chunkNumber} of ${totalChunkCount}...`
                    : nextStage.label,
                transcript: rawText || undefined,
                progress: Math.min(72, nextStage.progress ?? chunkProgressBase),
              }),
          });

          rawText = appendTranscript(rawText, chunkText);
          pendingAudioUris = pendingAudioUris.slice(1);
          currentRetryState = {
            ...currentRetryState,
            audioUri: pendingAudioUris[0] ?? null,
            audioUris: pendingAudioUris,
            rawText,
            interrupted: false,
            lastError: null,
          };
          retryStateRef.current = currentRetryState;
          await saveRetryState(currentRetryState);

          setStatus({
            stage: 'processing',
            label:
              pendingAudioUris.length > 0
                ? `Processing recording part ${chunkNumber + 1} of ${totalChunkCount}...`
                : settings.enhanceText
                  ? 'Polishing transcript...'
                  : 'Finalizing copy...',
            transcript: rawText || undefined,
            progress: Math.min(
              settings.enhanceText ? 78 : 96,
              22 + Math.round(((chunkNumber / Math.max(totalChunkCount, 1)) * 56))
            ),
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
                  progress: nextStage.progress ?? 84,
                }),
            })
          : rawText;

        await finalizeSuccess(rawText, refinedText, currentRetryState.durationMillis);
      } catch (error) {
        const message = getErrorMessage(error);
        const failedState: PersistedRetryState = {
          ...currentRetryState,
          audioUri: pendingAudioUris[0] ?? currentRetryState.audioUri ?? null,
          audioUris: pendingAudioUris,
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

  const scheduleChunkRotation = useCallback(() => {
    clearChunkTimer();
    chunkTimerRef.current = setTimeout(() => {
      const activeSession = activeSessionRef.current;
      if (!activeSession || stopRequestedRef.current) {
        return;
      }

      if (rotationPromiseRef.current) {
        return;
      }

      rotationPromiseRef.current = (async () => {
        try {
          const completed = await stopRecorder(recorder);

          if (completed.uri && completed.durationMillis >= MIN_CHUNK_DURATION_MS) {
            activeSession.chunkUris.push(completed.uri);
            activeSession.totalDurationMillis += completed.durationMillis;
            setSessionDurationMillis(activeSession.totalDurationMillis);
          }

          if (!stopRequestedRef.current) {
            finalRecordingRef.current = { url: null, error: null };
            await startRecorder(recorder);
            scheduleChunkRotation();
          }
        } catch (error) {
          activeSessionRef.current = null;
          stopRequestedRef.current = false;
          setIsSessionRecording(false);
          setSessionDurationMillis(0);
          setStatus({
            stage: 'error',
            label: 'Recording interrupted',
            error: getErrorMessage(error),
            progress: 0,
          });
        }
      })().finally(() => {
        rotationPromiseRef.current = null;
      });

      void rotationPromiseRef.current;
    }, CHUNK_ROTATION_MS);
  }, [clearChunkTimer, recorder, setStatus]);

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
      stopRequestedRef.current = false;
      activeSessionRef.current = {
        sessionId: `mobile-${Date.now()}`,
        createdAt: Date.now(),
        totalDurationMillis: 0,
        chunkUris: [],
      };
      finalRecordingRef.current = { url: null, error: null };
      setSessionDurationMillis(0);
      setIsSessionRecording(true);

      await startRecorder(recorder);
      scheduleChunkRotation();

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
      activeSessionRef.current = null;
      stopRequestedRef.current = false;
      setIsSessionRecording(false);
      setSessionDurationMillis(0);
      setStatus({
        stage: 'error',
        label: 'Failed to start recording',
        error: getErrorMessage(error),
        progress: 0,
      });
    }
  }, [clearResetTimer, recorder, scheduleChunkRotation, setStatus]);

  const stopAndProcess = useCallback(async () => {
    const activeSession = activeSessionRef.current;
    if (!activeSession) {
      setStatus({
        stage: 'error',
        label: 'Nothing is recording',
        error: 'Start a new recording before trying to stop it.',
        progress: 0,
      });
      return;
    }

    try {
      stopRequestedRef.current = true;
      clearChunkTimer();
      setIsSessionRecording(true);

      if (rotationPromiseRef.current) {
        await rotationPromiseRef.current;
      }

      const recorderStatus = recorder.getStatus();
      let completed = null as Awaited<ReturnType<typeof stopRecorder>> | null;

      try {
        completed = await stopRecorder(recorder);
      } catch (error) {
        const fallbackUri = finalRecordingRef.current.url ?? recorderStatus.url;
        if (!fallbackUri) {
          throw error;
        }

        completed = {
          uri: fallbackUri,
          durationMillis: recorderStatus.durationMillis,
        };
      }

      const finalUri = completed.uri ?? finalRecordingRef.current.url ?? recorderStatus.url;
      const finalDurationMillis = Math.max(completed.durationMillis, recorderStatus.durationMillis);

      if (finalUri && finalDurationMillis >= MIN_CHUNK_DURATION_MS) {
        activeSession.chunkUris.push(finalUri);
        activeSession.totalDurationMillis += finalDurationMillis;
        setSessionDurationMillis(activeSession.totalDurationMillis);
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Optional.
      }

      activeSessionRef.current = null;
      stopRequestedRef.current = false;
      setIsSessionRecording(false);

      if (activeSession.chunkUris.length === 0) {
        const finalRecorderError = finalRecordingRef.current.error;
        if (finalRecorderError) {
          setIsSessionRecording(false);
          setSessionDurationMillis(0);
          setStatus({
            stage: 'error',
            label: 'Recording failed',
            error: finalRecorderError,
            progress: 0,
          });
          return;
        }

        setIsSessionRecording(false);
        setSessionDurationMillis(0);
        setStatus({
          stage: 'empty',
          label: 'Nothing was captured',
          progress: 100,
        });
        scheduleReturnToIdle();
        return;
      }

      const retryState = buildRetryState(
        activeSession.sessionId,
        [...activeSession.chunkUris],
        activeSession.totalDurationMillis,
        activeSession.createdAt
      );

      retryStateRef.current = retryState;
      setHasPendingRetry(true);
      await saveRetryState(retryState);
      await processRetryState(retryState);
    } catch (error) {
      setIsSessionRecording(false);
      setStatus({
        stage: 'error',
        label: 'Failed to stop recording',
        error: getErrorMessage(error),
        progress: 0,
      });
    }
  }, [clearChunkTimer, processRetryState, recorder, scheduleReturnToIdle, setStatus]);

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
    finalRecordingRef.current = { url: null, error: null };
    setIsSessionRecording(false);
    setSessionDurationMillis(0);
    setStatus({
      stage: 'idle',
      label: 'Ready to record',
    });
  }, [setStatus]);

  const cancelActiveRecording = useCallback(async () => {
    clearChunkTimer();
    stopRequestedRef.current = true;

    if (rotationPromiseRef.current) {
      await rotationPromiseRef.current;
    }

    const recorderStatus = recorder.getStatus();
    if (recorderStatus.isRecording) {
      await cancelRecorder(recorder);
    }

    activeSessionRef.current = null;
    stopRequestedRef.current = false;
    finalRecordingRef.current = { url: null, error: null };
    setIsSessionRecording(false);
    setSessionDurationMillis(0);
    setVoiceLevels(Array.from({ length: VOICE_BAR_COUNT }, () => 0));
    setStatus({
      stage: 'idle',
      label: 'Ready to record',
    });
  }, [clearChunkTimer, recorder, setStatus]);

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
    setSessionDurationMillis(0);
    setIsSessionRecording(false);
  }, [clearResetTimer, hydrateRetryBanner, setStatus]);

  return {
    status,
    usageStats,
    hasPendingRetry,
    isRecording: isSessionRecording,
    durationMillis: sessionDurationMillis,
    voiceLevels,
    startRecording: startRecordingSession,
    stopAndProcess,
    retryLastSession,
    discardRetrySession,
    cancelActiveRecording,
    reset,
  };
}
