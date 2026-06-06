import { useCallback, useEffect, useRef, useState } from "react";
import { writeClipboard } from "../webAppUtils";

export function useCopyFeedback(onStatus: (message: string) => void) {
  const copyTimerRef = useRef<number | null>(null);
  const entryCopyTimerRef = useRef<number | null>(null);

  const [copyState, setCopyState] = useState("");
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

  const flashCopyState = useCallback((label: string) => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    setCopyState(label);
    copyTimerRef.current = window.setTimeout(() => setCopyState(""), 1400);
  }, []);

  const copyText = useCallback(async (text: string, entryId?: string) => {
    try {
      await writeClipboard(text);
      onStatus("Copied to clipboard.");
      flashCopyState("COPIED");
      if (entryId) {
        if (entryCopyTimerRef.current !== null) window.clearTimeout(entryCopyTimerRef.current);
        setCopiedEntryId(entryId);
        entryCopyTimerRef.current = window.setTimeout(() => setCopiedEntryId(null), 1400);
      }
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Copy failed.");
      flashCopyState("COPY FAILED");
    }
  }, [flashCopyState, onStatus]);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    if (entryCopyTimerRef.current !== null) window.clearTimeout(entryCopyTimerRef.current);
  }, []);

  return { copiedEntryId, copyState, copyText, setCopyState };
}
