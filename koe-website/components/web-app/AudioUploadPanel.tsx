"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, FileAudio2, Loader2, Upload, XCircle } from "lucide-react";
import { AppPhase } from "./types";
import { formatSeconds } from "./webAppUtils";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

type AudioUploadPanelProps = {
  phase: AppPhase;
  transcript: string;
  busyLabel: string;
  copyState: string;
  onUpload: (file: File, audioSeconds: number) => void;
  onCopy: () => void;
  onClear: () => void;
};

export function AudioUploadPanel({ phase, transcript, busyLabel, copyState, onUpload, onCopy, onClear }: AudioUploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isProcessing = phase === "processing";

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
      setFileError("Audio file is too large. Keep uploads under 20 MB.");
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
    onUpload(selectedFile, estimatedSeconds || 0);
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
          {isProcessing ? "UPLOADING" : "PROCESS FILE"}
        </button>
      </div>

      <label className="border-raw bg-zinc/10 p-5 normal-case flex flex-col gap-3 cursor-pointer hover:bg-zinc/20 transition-colors">
        <span className="flex items-center gap-3 text-bone font-bold uppercase text-sm">
          <FileAudio2 className="w-5 h-5 text-amber" />
          Select audio file
        </span>
        <span className="text-sm text-muted leading-relaxed">
          Upload WAV, MP3, M4A, WebM, or other browser-supported audio. Koe sends this through the same signed-in account pipeline as recording, so managed quota is checked before transcription.
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

      <div className="border-raw bg-zinc/10 min-h-[180px] p-5 normal-case leading-relaxed whitespace-pre-wrap mt-4">
        {transcript || <span className="text-muted">Uploaded audio transcripts will appear here and be saved to your signed-in account history.</span>}
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mt-5">
        <button type="button" className="webapp-utility-button" onClick={onCopy} disabled={!transcript}>
          <Copy className="w-4 h-4" />
          {copyState || "COPY"}
        </button>
        <button type="button" className="webapp-utility-button" onClick={clearSelection}>
          <CheckCircle2 className="w-4 h-4" />
          CLEAR
        </button>
      </div>
    </div>
  );
}
