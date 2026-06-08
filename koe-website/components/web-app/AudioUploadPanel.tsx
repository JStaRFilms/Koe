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
  const [viewMode, setViewMode] = useState<"refined" | "raw">("refined");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasRaw = Boolean(rawTranscript.trim());
  const hasRefined = Boolean(refinedTranscript.trim());

  useEffect(() => {
    if (hasRefined) {
      setViewMode("refined");
    } else if (hasRaw) {
      setViewMode("raw");
    }
  }, [hasRefined, hasRaw]);
  const isProcessing = phase === "processing";

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
    setViewMode("refined");
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  const submitUpload = () => {
    if (!selectedFile || fileError || isProcessing || busyLabel) return;
    onUpload(selectedFile, estimatedSeconds || 0, enhanceText);
  };

  return (
    <div className="panel-brutal p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <p className="text-amber text-xs font-bold mb-1.5">AUDIO UPLOAD</p>
          <h2 className="font-deco text-2xl md:text-3xl text-bone">UPLOAD A FILE</h2>
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

      <label className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-4 normal-case flex flex-col gap-2.5 cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-zinc)_18%,var(--color-void))] transition-colors">
        <span className="flex items-center gap-2 text-bone font-bold uppercase text-xs">
          <FileAudio2 className="w-4 h-4 text-amber" />
          Select audio file
        </span>
        <span className="text-xs text-muted leading-relaxed">
          Upload WAV, MP3, M4A, WebM, or other browser-supported audio. Web uploads are limited to 4.5 MB due to serverless execution limits (use native apps for up to 25 MB).
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

      <div className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-3 mt-3 normal-case min-h-[72px]">
        {selectedFile ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-bone font-bold text-xs break-all">{selectedFile.name}</p>
              <p className="text-[10px] text-muted mt-0.5">
                {formatBytes(selectedFile.size)} · {estimatedSeconds ? formatSeconds(estimatedSeconds) : "duration detected server-side when possible"}
              </p>
              <p className="text-[10px] text-muted mt-1 leading-relaxed">
                Managed mode remains proxied through Koe. BYOK/local native app mode remains direct-to-provider for speed.
              </p>
            </div>
            <button type="button" className="webapp-icon-button shrink-0 w-8 h-8 min-w-8 min-height-8" onClick={clearSelection} disabled={isProcessing} aria-label="Clear selected file">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted leading-relaxed">
            No file selected. Files are processed for the request and are not intentionally stored by Koe.
          </p>
        )}
        {fileError ? <p className="text-xs text-crimson mt-2">{fileError}</p> : null}
      </div>

      <label className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-3 mt-3 normal-case flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={enhanceText}
          onChange={(event) => setEnhanceText(event.target.checked)}
          disabled={isProcessing || Boolean(busyLabel)}
        />
        <span>
          <span className="block text-bone text-xs font-bold uppercase">Refine after transcription</span>
          <span className="block text-[10px] text-muted mt-0.5 leading-relaxed">
            On: return raw + polished text. Off: return raw transcription only.
          </span>
        </span>
      </label>

      {/* TRANSCRIPT VIEWPORT */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-amber text-xs font-bold uppercase">
            {viewMode === "refined" ? "REFINED TRANSCRIPT" : "RAW TRANSCRIPT"}
          </p>
          {hasRaw && hasRefined && rawTranscript.trim() !== refinedTranscript.trim() ? (
            <div className="flex border-raw text-[10px] uppercase overflow-hidden">
              {(["refined", "raw"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`px-2 py-0.5 font-bold cursor-pointer transition-colors ${
                    viewMode === mode 
                      ? "bg-amber text-void" 
                      : "bg-void text-muted hover:bg-zinc/20"
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        
        <div className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] min-h-[160px] p-4 normal-case leading-relaxed text-sm whitespace-pre-wrap">
          {(viewMode === "refined" ? refinedTranscript : rawTranscript) || (
            <span className="text-muted">
              {isProcessing 
                ? "Processing your uploaded audio file..." 
                : "Uploaded audio transcript will appear here."}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button 
          type="button" 
          className="webapp-utility-button w-full sm:w-auto" 
          onClick={viewMode === "refined" ? onCopyRefined : onCopyRaw} 
          disabled={!(viewMode === "refined" ? refinedTranscript : rawTranscript)}
        >
          <Copy className="w-4 h-4" />
          {copyState || `COPY ${viewMode.toUpperCase()}`}
        </button>
        <button type="button" className="webapp-utility-button w-full sm:w-auto" onClick={clearSelection}>
          <CheckCircle2 className="w-4 h-4" />
          CLEAR
        </button>
      </div>
    </div>
  );
}
