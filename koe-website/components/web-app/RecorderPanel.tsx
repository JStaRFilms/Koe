import { CheckCircle2, Copy, Loader2, Mic, MicOff } from "lucide-react";
import { AppPhase } from "./types";

type RecorderPanelProps = {
  phase: AppPhase;
  transcript: string;
  inputLevel: number;
  busyLabel: string;
  isSupported: boolean;
  copyState: string;
  onRecordToggle: () => void;
  onCopy: () => void;
  onClear: () => void;
};

export function RecorderPanel({
  phase,
  transcript,
  inputLevel,
  busyLabel,
  isSupported,
  copyState,
  onRecordToggle,
  onCopy,
  onClear,
}: RecorderPanelProps) {
  const isRecording = phase === "recording";
  const isProcessing = phase === "processing";
  const levelText = isRecording
    ? inputLevel > 0.22
      ? "Speaking"
      : inputLevel > 0.08
        ? "Low input"
        : "Quiet"
    : isProcessing
      ? "Processing"
      : "Ready";
  const levelBand = Math.max(0, Math.min(6, Math.round((isRecording ? inputLevel : 0) * 6)));

  return (
    <div className="border-raw bg-void p-5 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 md:mb-6">
        <div>
          <p className="text-amber text-xs font-bold mb-2">WEB RECORDER</p>
          <h1 className="font-deco text-3xl md:text-4xl text-bone">DICTATE IN BROWSER</h1>
        </div>
        <button
          type="button"
          className={`btn-brutal webapp-action justify-center ${isRecording ? "bg-crimson border-crimson" : ""}`}
          onClick={onRecordToggle}
          disabled={isProcessing || Boolean(busyLabel)}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isRecording ? "STOP" : isProcessing ? "PROCESSING" : "RECORD"}
        </button>
      </div>

      <div className={`voice-meter voice-meter-level-${levelBand} ${isRecording ? "voice-meter-live" : ""} ${phase === "error" ? "voice-meter-error" : ""}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="voice-pin" aria-hidden="true" />
          <div>
            <p className={`voice-copy voice-copy-level-${levelBand}`}>{levelText}</p>
            <p className="text-xs text-muted normal-case">{isSupported ? "Mic input monitor" : "Mic unavailable"}</p>
          </div>
        </div>
        <div className={`voice-bars voice-level-${levelBand}`} aria-label={`Microphone input level ${Math.round(inputLevel * 100)} percent`}>
          {[1, 2, 3, 4, 5].map((index) => (
            <span key={index} className={`voice-bar voice-bar-${index}`} />
          ))}
        </div>
      </div>

      <div className="border-raw bg-zinc/10 min-h-[220px] p-5 normal-case leading-relaxed whitespace-pre-wrap">
        {transcript || <span className="text-muted">Record speech and Koe will save the signed-in transcript to your account history.</span>}
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mt-5">
        <button type="button" className="webapp-utility-button" onClick={onCopy} disabled={!transcript}>
          <Copy className="w-4 h-4" />
          {copyState || "COPY"}
        </button>
        <button type="button" className="webapp-utility-button" onClick={onClear}>
          <CheckCircle2 className="w-4 h-4" />
          CLEAR
        </button>
      </div>
    </div>
  );
}
