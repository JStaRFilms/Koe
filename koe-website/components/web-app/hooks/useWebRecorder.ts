import { useCallback, useEffect, useRef, useState } from "react";

type RecorderOptions = {
  maxRecordingMs?: number;
  onBeforeStart: () => void;
  onAudioReady: (audioBlob: Blob, audioSeconds: number) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
};

type WindowWithAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const DEFAULT_MAX_RECORDING_MS = 90_000;

function getAudioContextCtor() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext || null;
}

export function useWebRecorder({
  maxRecordingMs = DEFAULT_MAX_RECORDING_MS,
  onBeforeStart,
  onAudioReady,
  onStatus,
  onError,
}: RecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [inputLevel, setInputLevel] = useState(0);

  const isSupported = typeof window !== "undefined" && Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const stopMeter = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    analyserRef.current?.disconnect();
    analyserRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setInputLevel(0);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const samples = new Uint8Array(analyser.frequencyBinCount);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const tick = () => {
      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const gatedLevel = Math.max(0, average - 8) / 118;
      setInputLevel(Math.min(1, gatedLevel));
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      onStatus("Processing audio...");
    }
  }, [onStatus]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onError("Recording is unsupported in this browser. Use recent Chrome or Edge.");
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    try {
      onBeforeStart();
      stopStream();
      stopMeter();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startMeter(stream);

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearStopTimeout();
        stopMeter();
        stopStream();
        onError("Recorder error. Please retry.");
      };

      recorder.onstop = () => {
        clearStopTimeout();
        stopMeter();
        stopStream();

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];

        const startedAt = recordingStartedAtRef.current;
        const audioSeconds = startedAt ? Math.max(1, Math.round((performance.now() - startedAt) / 1000)) : 0;
        recordingStartedAtRef.current = null;

        if (audioBlob.size === 0) {
          onError("No audio captured. Check mic permissions and try again.");
          return;
        }

        onAudioReady(audioBlob, audioSeconds);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      recordingStartedAtRef.current = performance.now();
      onStatus("Recording through web app...");

      stopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, maxRecordingMs);
    } catch {
      clearStopTimeout();
      stopMeter();
      stopStream();
      onError("Could not start recording. Check microphone permissions and retry.");
    }
  }, [clearStopTimeout, isSupported, maxRecordingMs, onAudioReady, onBeforeStart, onError, onStatus, startMeter, stopMeter, stopStream]);

  useEffect(() => {
    return () => {
      clearStopTimeout();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopMeter();
      stopStream();
    };
  }, [clearStopTimeout, stopMeter, stopStream]);

  return {
    inputLevel,
    isSupported,
    startRecording,
    stopRecording,
  };
}
