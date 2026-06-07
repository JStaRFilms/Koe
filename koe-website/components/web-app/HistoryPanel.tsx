import { useState } from "react";
import { Copy } from "lucide-react";
import { Snapshot } from "./types";
import { formatDate, formatSeconds } from "./webAppUtils";

type HistoryPanelProps = {
  history: Snapshot["recentHistory"];
  copiedEntryId: string | null;
  onCopyEntry: (id: string, text: string) => void;
};

export function HistoryPanel({ history, copiedEntryId, onCopyEntry }: HistoryPanelProps) {
  const [textModes, setTextModes] = useState<Record<string, "refined" | "raw">>({});

  return (
    <div className="border-raw bg-void p-5 md:p-6">
      <p className="text-amber text-xs font-bold mb-4">RECENT ACCOUNT HISTORY</p>
      <div className="space-y-3 normal-case">
        {history.length ? (
          history.map((item) => {
            const hasDistinctRawText = Boolean(item.refinedText && item.refinedText.trim() !== item.rawText.trim());
            const selectedMode = hasDistinctRawText ? textModes[item.id] || "refined" : "refined";
            const text = selectedMode === "raw" ? item.rawText : item.refinedText || item.rawText;
            const copied = copiedEntryId === item.id;
            return (
              <div key={item.id} className="border-raw bg-zinc/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-2 text-xs uppercase text-muted">
                  <span>{item.mode}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-[11px] uppercase text-muted">
                    {item.segmentCount && item.segmentCount > 1 ? `${item.segmentCount} parts` : "1 recording"}
                    {item.audioSeconds > 0 ? ` / ${formatSeconds(item.audioSeconds)}` : ""}
                  </div>
                  {hasDistinctRawText ? (
                    <div className="grid grid-cols-2 border-raw text-[11px] uppercase overflow-hidden">
                      {(["refined", "raw"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`px-2.5 py-1 ${selectedMode === mode ? "bg-amber text-void" : "bg-void text-muted"}`}
                          onClick={() => setTextModes((current) => ({ ...current, [item.id]: mode }))}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="text-sm text-bone line-clamp-3">{text}</p>
                <button type="button" className="webapp-inline-action" onClick={() => onCopyEntry(item.id, text)}>
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "COPIED" : "COPY ENTRY"}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted">No synced transcript history yet.</p>
        )}
      </div>
    </div>
  );
}
