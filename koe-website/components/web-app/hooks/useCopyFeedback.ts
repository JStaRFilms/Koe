import { useCallback, useEffect, useRef, useState } from "react";
import { writeClipboard } from "../webAppUtils";
import { useToast } from "../Toast";

export function useCopyFeedback(onStatus: (message: string) => void) {
  const { toast } = useToast();
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
      toast("Copied to Clipboard", "The transcript has been copied to your clipboard.", "success");
      flashCopyState("COPIED");
      if (entryId) {
        if (entryCopyTimerRef.current !== null) window.clearTimeout(entryCopyTimerRef.current);
        setCopiedEntryId(entryId);
        entryCopyTimerRef.current = window.setTimeout(() => setCopiedEntryId(null), 1400);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Copy failed.";
      onStatus(msg);
      toast("Copy Failed", msg, "error");
      flashCopyState("COPY FAILED");
    }
  }, [flashCopyState, onStatus, toast]);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    if (entryCopyTimerRef.current !== null) window.clearTimeout(entryCopyTimerRef.current);
  }, []);

  return { copiedEntryId, copyState, copyText, setCopyState };
}
