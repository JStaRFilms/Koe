import { Copy } from "lucide-react";
import { Snapshot } from "./types";
import { formatDate } from "./webAppUtils";

type HistoryPanelProps = {
  history: Snapshot["recentHistory"];
  copiedEntryId: string | null;
  onCopyEntry: (id: string, text: string) => void;
};

export function HistoryPanel({ history, copiedEntryId, onCopyEntry }: HistoryPanelProps) {
  return (
    <div className="border-raw bg-void p-5 md:p-6">
      <p className="text-amber text-xs font-bold mb-4">RECENT ACCOUNT HISTORY</p>
      <div className="space-y-3 normal-case">
        {history.length ? (
          history.map((item) => {
            const text = item.refinedText || item.rawText;
            const copied = copiedEntryId === item.id;
            return (
              <div key={item.id} className="border-raw bg-zinc/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-2 text-xs uppercase text-muted">
                  <span>{item.mode}</span>
                  <span>{formatDate(item.createdAt)}</span>
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
