"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Copy, Trash2, AlertTriangle } from "lucide-react";

const DAILY_LIMIT = 10;
const STORAGE_KEY = "koe_live_demo_usage_v1";
const MAX_RECORDING_MS = 90_000;

type DemoPhase = "idle" | "recording" | "transcribing" | "done" | "error";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getUsageCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return 0;
  }

  try {
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    if (parsed.date !== getTodayKey()) {
      return 0;
    }
    return typeof parsed.count === "number" ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function writeUsageCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({ date: getTodayKey(), count });
  window.localStorage.setItem(STORAGE_KEY, payload);
}

export function LiveDemo() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [isClient, setIsClient] = useState(false);
  const [usageCount, setUsageCount] = useState(() => getUsageCount());
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Record speech, then stop to transcribe.");
  const isSupported = typeof window !== "undefined" && Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);

  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usageCount), [usageCount]);
  const isRecording = phase === "recording";
  const isTranscribing = phase === "transcribing";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const incrementUsage = () => {
    setUsageCount((prev) => {
      const next = prev + 1;
      writeUsageCount(next);
      return next;
    });
  };

  const clearStopTimeout = () => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  };

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearStopTimeout();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopTracks();
    };
  }, []);

  const transcribeAudio = async (audioBlob: Blob) => {
    setPhase("transcribing");
    setStatus("Transcribing...");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "demo.webm");
      formData.append("language", "auto");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Transcription failed (${response.status}).`);
      }

      incrementUsage();
      const finalText = (data.text || "").trim();
      setTranscript(finalText);
      setPhase("done");
      setStatus(finalText ? "Transcription complete." : "Transcription complete (no speech detected).");
    } catch (error) {
      setPhase("error");
      setStatus(error instanceof Error ? error.message : "Transcription failed.");
    }
  };

  const startRecording = async () => {
    if (!isSupported) {
      setPhase("error");
      setStatus("Recording is unsupported in this browser. Use recent Chrome or Edge.");
      return;
    }

    if (isRecording || isTranscribing) {
      return;
    }

    if (remaining <= 0) {
      setPhase("error");
      setStatus("Daily demo limit reached. Please try again tomorrow.");
      return;
    }

    try {
      setTranscript("");
      clearStopTimeout();
      stopTracks();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
        setPhase("error");
        setStatus("Recorder error. Please retry.");
        clearStopTimeout();
        stopTracks();
      };

      recorder.onstop = () => {
        clearStopTimeout();
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stopTracks();
        audioChunksRef.current = [];
        if (audioBlob.size === 0) {
          setPhase("error");
          setStatus("No audio captured. Check mic permissions and try again.");
          return;
        }
        void transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setPhase("recording");
      setStatus("Recording...");

      stopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch {
      setPhase("error");
      setStatus("Could not start recording. Check microphone permissions and retry.");
      clearStopTimeout();
      stopTracks();
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }

    clearStopTimeout();
    try {
      mediaRecorderRef.current.stop();
      setStatus("Processing audio...");
    } catch {
      setPhase("error");
      setStatus("Stop request failed. Try again.");
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setPhase("idle");
    setStatus("Record speech, then stop to transcribe.");
  };

  const copyTranscript = async () => {
    const text = transcript.trim();
    if (!text) {
      setStatus("No transcript to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Transcript copied to clipboard.");
    } catch {
      setStatus("Clipboard permission blocked.");
    }
  };

  return (
    <section id="live-demo" className="max-w-7xl mx-auto w-full border-x border-zinc bg-zinc/20">
      <div className="w-full p-8 border-raw-b bg-void flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="font-deco text-4xl text-amber">LIVE TRANSCRIPTION DEMO</h2>
        <div className="text-sm font-mono text-muted normal-case">
          {usageCount}/{DAILY_LIMIT} used today
        </div>
      </div>

      <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8">
        <div className="border-raw bg-void min-h-[220px] p-6 font-mono text-base normal-case leading-relaxed">
          {transcript ? (
            <span>{transcript}</span>
          ) : (
            <span className="text-muted">
              Press Start Recording, speak, then Stop Recording to transcribe.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-[220px]">
          <button
            type="button"
            onClick={isRecording ? stopRecording : () => void startRecording()}
            className={`btn-brutal justify-center ${isRecording ? "bg-crimson border-crimson" : ""}`}
            disabled={isTranscribing || (!isRecording && remaining <= 0)}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isRecording ? "STOP RECORDING" : isTranscribing ? "TRANSCRIBING..." : "START RECORDING"}
          </button>

          <button type="button" onClick={copyTranscript} className="btn-brutal justify-center" disabled={!transcript}>
            <Copy className="w-5 h-5" />
            COPY TEXT
          </button>

          <button type="button" onClick={clearTranscript} className="btn-brutal justify-center">
            <Trash2 className="w-5 h-5" />
            CLEAR
          </button>
        </div>
      </div>

      <div className="border-t border-zinc p-6 flex items-center gap-3 text-sm font-mono normal-case">
        <AlertTriangle className="w-4 h-4 text-amber shrink-0" />
        <span className="text-muted">
          {status}
          {isClient && !isSupported ? " Browser recording is unavailable in this environment." : ""}
        </span>
      </div>
    </section>
  );
}
