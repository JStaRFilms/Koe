"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, FileAudio2, Loader2, Upload, XCircle } from "lucide-react";
import { AppPhase } from "./types";
import { formatSeconds } from "./webAppUtils";
import { useToast } from "./Toast";

const MAX_AUDIO_BYTES = 4.5 * 1024 * 1024; // 4.5 MB Vercel Serverless Function payload limit

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

type AudioUploadPanelProps = {
  phase: AppPhase;
  rawTranscript: string;
  refinedTranscript: string;
  busyLabel: string;
  copyState: string;
  defaultEnhanceText: boolean;
  onUpload: (file: File, audioSeconds: number, enhanceText: boolean) => void;
  onCopyRaw: () => void;
  onCopyRefined: () => void;
  onClear: () => void;
};

export function AudioUploadPanel({
  phase,
  rawTranscript,
  refinedTranscript,
  busyLabel,
  copyState,
  defaultEnhanceText,
  onUpload,
  onCopyRaw,
  onCopyRefined,
  onClear,
}: AudioUploadPanelProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [fileError, setFileError] = useState("");
  const [enhanceText, setEnhanceText] = useState(defaultEnhanceText);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isProcessing = phase === "processing";
  const hasRaw = Boolean(rawTranscript.trim());
  const hasRefined = Boolean(refinedTranscript.trim());

  useEffect(() => {
    setEnhanceText(defaultEnhanceText);
  }, [defaultEnhanceText]);

  useEffect(() => {
    if (!selectedFile) return;

    const objectUrl = URL.createObjectURL(selectedFile);
    const audio = document.createElement("audio");

    const handleLoadedMetadata = () => {
      setEstimatedSeconds(Number.isFinite(audio.duration) && audio.duration > 0 ? Math.max(1, Math.round(audio.duration)) : null);
    };

    const handleError = () => setEstimatedSeconds(null);

    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    audio.src = objectUrl;

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileError("");
    setSelectedFile(null);
    setEstimatedSeconds(null);

    if (!file) return;

    if (file.size > MAX_AUDIO_BYTES) {
      const msg = "Audio file is too large. Web uploads are limited to 4.5 MB due to serverless constraints. Use the desktop or mobile app for larger files.";
      setFileError(msg);
      toast("File Too Large", msg, "error");
      return;
    }

    setSelectedFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setEstimatedSeconds(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  const submitUpload = () => {
    if (!selectedFile || fileError || isProcessing || busyLabel) return;
    onUpload(selectedFile, estimatedSeconds || 0, enhanceText);
  };

  return (
    <div className="border-raw bg-void p-5 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 md:mb-6">
        <div>
          <p className="text-amber text-xs font-bold mb-2">AUDIO UPLOAD</p>
          <h2 className="font-deco text-3xl md:text-4xl text-bone">UPLOAD A FILE</h2>
        </div>
        <button
          type="button"
          className="btn-brutal webapp-action justify-center"
          onClick={submitUpload}
          disabled={!selectedFile || Boolean(fileError) || isProcessing || Boolean(busyLabel)}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {isProcessing ? "PROCESSING" : enhanceText ? "TRANSCRIBE + REFINE" : "TRANSCRIBE RAW"}
        </button>
      </div>

      <label className="border-raw bg-zinc/10 p-5 normal-case flex flex-col gap-3 cursor-pointer hover:bg-zinc/20 transition-colors">
        <span className="flex items-center gap-3 text-bone font-bold uppercase text-sm">
          <FileAudio2 className="w-5 h-5 text-amber" />
          Select audio file
        </span>
        <span className="text-sm text-muted leading-relaxed">
          Upload WAV, MP3, M4A, WebM, or other browser-supported audio. Web uploads are limited to 4.5 MB due to serverless execution limits (use the native desktop/mobile apps for up to 25 MB files).
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.flac"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isProcessing || Boolean(busyLabel)}
        />
      </label>

      <div className="border-raw bg-zinc/10 p-4 mt-4 normal-case min-h-[92px]">
        {selectedFile ? (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-bone font-bold break-all">{selectedFile.name}</p>
              <p className="text-xs text-muted mt-1">
                {formatBytes(selectedFile.size)} · {estimatedSeconds ? formatSeconds(estimatedSeconds) : "duration detected server-side when possible"}
              </p>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Managed mode remains proxied through Koe. BYOK/local native app mode remains direct-to-provider for speed.
              </p>
            </div>
            <button type="button" className="webapp-icon-button shrink-0" onClick={clearSelection} disabled={isProcessing} aria-label="Clear selected file">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted leading-relaxed">
            No file selected. Files are processed for the request and are not intentionally stored by Koe.
          </p>
        )}
        {fileError ? <p className="text-sm text-crimson mt-3">{fileError}</p> : null}
      </div>

      <label className="border-raw bg-zinc/10 p-4 mt-4 normal-case flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={enhanceText}
          onChange={(event) => setEnhanceText(event.target.checked)}
          disabled={isProcessing || Boolean(busyLabel)}
        />
        <span>
          <span className="block text-bone text-sm font-bold uppercase">Refine after transcription</span>
          <span className="block text-xs text-muted mt-1 leading-relaxed">
            On: return raw + polished text. Off: return raw transcription only.
          </span>
        </span>
      </label>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-amber text-xs font-bold mb-2">RAW TRANSCRIPT</p>
          <div className="border-raw bg-zinc/10 min-h-[180px] p-5 normal-case leading-relaxed whitespace-pre-wrap">
            {rawTranscript || <span className="text-muted">Raw uploaded audio transcript will appear here.</span>}
          </div>
        </div>
        <div>
          <p className="text-amber text-xs font-bold mb-2">REFINED TRANSCRIPT</p>
          <div className="border-raw bg-zinc/10 min-h-[180px] p-5 normal-case leading-relaxed whitespace-pre-wrap">
            {refinedTranscript || <span className="text-muted">Refined text appears here when refinement is enabled.</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button type="button" className="webapp-utility-button w-full sm:w-auto" onClick={onCopyRaw} disabled={!hasRaw}>
          <Copy className="w-4 h-4" />
          {copyState || "COPY RAW"}
        </button>
        <button type="button" className="webapp-utility-button w-full sm:w-auto" onClick={onCopyRefined} disabled={!hasRefined}>
          <Copy className="w-4 h-4" />
          COPY REFINED
        </button>
        <button type="button" className="webapp-utility-button w-full sm:w-auto" onClick={clearSelection}>
          <CheckCircle2 className="w-4 h-4" />
          CLEAR
        </button>
      </div>
    </div>
  );
}
