"use client";

import { useMemo, useRef, useState } from "react";
import { Mic, MicOff, Copy, Trash2, AlertTriangle } from "lucide-react";

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const DAILY_LIMIT = 10;
const STORAGE_KEY = "koe_live_demo_usage_v1";

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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionHasFinalRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [usageCount, setUsageCount] = useState(() => getUsageCount());
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState("Press record to start a live browser transcription.");
  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usageCount), [usageCount]);

  const incrementUsage = () => {
    setUsageCount((prev) => {
      const next = prev + 1;
      writeUsageCount(next);
      return next;
    });
  };

  const startRecording = () => {
    if (!isSupported) {
      setStatus("This browser does not support live speech recognition. Try Chrome or Edge.");
      return;
    }

    if (remaining <= 0) {
      setStatus("Daily demo limit reached. Please try again tomorrow.");
      return;
    }

    const ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!ctor) {
      setStatus("Speech recognition is unavailable in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onstart = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
    }

    const recognition = new ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    sessionHasFinalRef.current = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening...");
    };

    recognition.onresult = (resultEvent: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < resultEvent.results.length; i += 1) {
        const value = resultEvent.results[i][0]?.transcript ?? "";
        if (resultEvent.results[i].isFinal) {
          finalText += value;
        } else {
          interimText += value;
        }
      }

      setTranscript(finalText.trim());
      setInterim(interimText.trim());
      if (finalText.trim()) {
        sessionHasFinalRef.current = true;
      }
    };

    recognition.onerror = (speechEvent: SpeechRecognitionErrorEventLike) => {
      setStatus(`Recognition error: ${speechEvent.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim("");
      if (sessionHasFinalRef.current) {
        incrementUsage();
        setStatus("Transcription complete.");
        sessionHasFinalRef.current = false;
      } else {
        setStatus("Recording stopped.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterim("");
    setStatus("Transcript cleared.");
  };

  const copyTranscript = async () => {
    const text = `${transcript}${interim ? ` ${interim}` : ""}`.trim();
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
          {transcript || interim ? (
            <>
              <span>{transcript}</span>
              {interim ? <span className="text-muted italic"> {interim}</span> : null}
            </>
          ) : (
            <span className="text-muted">
              Start recording to see real-time text appear here.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-[220px]">
          <button
            type="button"
            onClick={isListening ? stopRecording : startRecording}
            className={`btn-brutal justify-center ${isListening ? "bg-crimson border-crimson" : ""}`}
            disabled={!isSupported || (!isListening && remaining <= 0)}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isListening ? "STOP RECORDING" : "START RECORDING"}
          </button>

          <button type="button" onClick={copyTranscript} className="btn-brutal justify-center">
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
        <span className="text-muted">{status}</span>
      </div>
    </section>
  );
}
