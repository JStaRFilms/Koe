"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccountPanel } from "./AccountPanel";
import { AudioUploadPanel } from "./AudioUploadPanel";
import { AuthPanel } from "./AuthPanel";
import { HistoryPanel } from "./HistoryPanel";
import { RecorderPanel } from "./RecorderPanel";
import { WebAppTabs } from "./WebAppTabs";
import { useAuthEmailFlows } from "./hooks/useAuthEmailFlows";
import { useCopyFeedback } from "./hooks/useCopyFeedback";
import { usePaystackBilling } from "./hooks/usePaystackBilling";
import { useWebRecorder } from "./hooks/useWebRecorder";
import { AccountMode, AppPhase, AuthMode, AuthResponse, Snapshot, WebAppTab } from "./types";
import { authHeaders, getInstallationId, getStoredToken, readApiError, setStoredToken } from "./webAppUtils";
import { ToastProvider, useToast } from "./Toast";

function createWebClientSessionId() {
  return `web-${crypto.randomUUID()}`;
}

export function WebKoeApp() {
  return (
    <ToastProvider>
      <WebKoeAppInner />
    </ToastProvider>
  );
}

function WebKoeAppInner() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const activeClientSessionIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<WebAppTab>("record");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [uploadPhase, setUploadPhase] = useState<AppPhase>("idle");
  const [busyLabel, setBusyLabel] = useState("");
  const [status, setStatus] = useState("Sign in to use Koe in the browser.");
  const [transcript, setTranscript] = useState("");
  const [uploadRawTranscript, setUploadRawTranscript] = useState("");
  const [uploadRefinedTranscript, setUploadRefinedTranscript] = useState("");
  
  const { copiedEntryId, copyState, copyText, setCopyState } = useCopyFeedback(setStatus);
  const { requestPasswordReset, requestVerification } = useAuthEmailFlows({ email, token, setBusyLabel, setStatus });
  
  const modeCopy = useMemo(() => {
    if (!snapshot) return "Sign in to load account mode.";
    if (snapshot.user.defaultMode === "managed") {
      return snapshot.capabilities.managed.available
        ? "Managed mode is ready. No API key is exposed to the browser."
        : "Managed mode is selected, but this account has no active managed allocation or quota.";
    }
    return snapshot.capabilities.byok.available
      ? `Account BYOK is ready. Koe will use your encrypted server-side key ending in ${snapshot.capabilities.byok.last4}.`
      : "BYOK is selected, but no account key is saved. Add one from desktop/mobile before using BYOK on web.";
  }, [snapshot]);

  const loadSnapshot = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    setBusyLabel("Refreshing account...");
    try {
      const response = await fetch("/api/v1/account/snapshot", { headers: authHeaders(activeToken) });
      if (!response.ok) throw new Error(await readApiError(response));
      setSnapshot((await response.json()) as Snapshot);
      setStatus("Account loaded. Record when ready.");
    } catch (error) {
      setSnapshot(null);
      setToken(null);
      setStoredToken(null);
      const errorMsg = error instanceof Error ? error.message : "Session expired. Please sign in again.";
      setStatus(errorMsg);
      toast("Session Expired", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  }, [token, toast]);

  const { startCheckout, changePlan, cancelPlan } = usePaystackBilling({ token, loadSnapshot, setBusyLabel, setStatus });

  const processAudio = useCallback(async (audioBlob: Blob, audioSeconds: number) => {
    if (!token || !snapshot) {
      setStatus("Sign in before recording.");
      return;
    }

    setPhase("processing");
    setStatus("Processing through your signed-in Koe account...");
    try {
      const clientSessionId = activeClientSessionIdRef.current || createWebClientSessionId();
      activeClientSessionIdRef.current = clientSessionId;

      const form = new FormData();
      form.append("audio", audioBlob, "koe-web.webm");
      form.append("requestId", crypto.randomUUID());
      form.append("clientSessionId", clientSessionId);
      form.append("audioSeconds", String(audioSeconds));
      form.append("mode", snapshot.user.defaultMode);
      form.append("language", snapshot.settings.language || "auto");
      form.append("model", snapshot.settings.model || "whisper-large-v3-turbo");
      form.append("promptStyle", snapshot.settings.promptStyle || "Clean");
      form.append("customPrompt", snapshot.settings.customPrompt || "");
      form.append("enhanceText", String(snapshot.settings.enhanceText !== false));

      const response = await fetch("/api/v1/process", { method: "POST", headers: authHeaders(token), body: form });
      
      if (response.status === 413) {
        throw new Error("Recorded audio is too large. Web processing is limited to 4.5 MB. Speak for a shorter duration or use the desktop app.");
      }

      const payload = (await response.json().catch(() => ({}))) as { rawText?: string; refinedText?: string; empty?: boolean; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Processing failed.");

      const text = (payload.refinedText || payload.rawText || "").trim();
      setTranscript(text);
      setPhase("done");
      const completeMsg = payload.empty || !text ? "No clear speech detected." : "Transcript saved to your account history.";
      setStatus(completeMsg);
      
      if (payload.empty || !text) {
        toast("No Speech Detected", completeMsg, "warning");
      } else {
        toast("Processing Completed", completeMsg, "success");
      }
      
      await loadSnapshot(token);
    } catch (error) {
      setPhase("error");
      const errorMsg = error instanceof Error ? error.message : "Processing failed.";
      setStatus(errorMsg);
      toast("Processing Failed", errorMsg, "error");
    } finally {
      activeClientSessionIdRef.current = null;
    }
  }, [loadSnapshot, snapshot, token, toast]);

  const processUploadedAudio = useCallback(async (audioFile: File, audioSeconds: number, enhanceText: boolean) => {
    if (!token || !snapshot) {
      setStatus("Sign in before uploading audio.");
      return;
    }

    setUploadPhase("processing");
    setUploadRawTranscript("");
    setUploadRefinedTranscript("");
    setStatus(enhanceText ? "Uploading audio for transcription and refinement..." : "Uploading audio for raw transcription...");
    try {
      const clientSessionId = `web-upload-${crypto.randomUUID()}`;
      const form = new FormData();
      form.append("audio", audioFile, audioFile.name || "koe-upload-audio");
      form.append("requestId", crypto.randomUUID());
      form.append("clientSessionId", clientSessionId);
      form.append("audioSeconds", String(audioSeconds));
      form.append("mode", snapshot.user.defaultMode);
      form.append("language", snapshot.settings.language || "auto");
      form.append("model", snapshot.settings.model || "whisper-large-v3-turbo");
      form.append("promptStyle", snapshot.settings.promptStyle || "Clean");
      form.append("customPrompt", snapshot.settings.customPrompt || "");
      form.append("enhanceText", String(enhanceText));

      const response = await fetch("/api/v1/process", { method: "POST", headers: authHeaders(token), body: form });
      
      if (response.status === 413) {
        throw new Error("Audio file too large. Web uploads are limited to 4.5 MB due to serverless constraints. Use the desktop or mobile app for larger files.");
      }

      const payload = (await response.json().catch(() => ({}))) as { rawText?: string; refinedText?: string; empty?: boolean; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Audio upload processing failed.");

      const rawText = (payload.rawText || "").trim();
      const refinedText = (payload.refinedText || "").trim();
      const text = refinedText || rawText;
      setUploadRawTranscript(rawText);
      setUploadRefinedTranscript(enhanceText ? refinedText || rawText : "");
      setUploadPhase("done");
      
      const successMsg = payload.empty || !text 
        ? "No clear speech detected in uploaded audio." 
        : enhanceText 
          ? "Raw and refined upload transcripts saved to history." 
          : "Raw upload transcript saved to history.";
      setStatus(successMsg);
      
      if (payload.empty || !text) {
        toast("No Speech Detected", successMsg, "warning");
      } else {
        toast("Upload Transcribed", successMsg, "success");
      }
      
      await loadSnapshot(token);
    } catch (error) {
      setUploadPhase("error");
      const errorMsg = error instanceof Error ? error.message : "Audio upload processing failed.";
      setStatus(errorMsg);
      toast("Upload Failed", errorMsg, "error");
    }
  }, [loadSnapshot, snapshot, token, toast]);

  const recorder = useWebRecorder({
    onBeforeStart: () => {
      activeClientSessionIdRef.current = createWebClientSessionId();
      setTranscript("");
      setCopyState("");
      setPhase("recording");
      toast("Recording Started", "Speak clearly into your microphone.", "info");
    },
    onAudioReady: processAudio,
    onStatus: setStatus,
    onError: (message) => {
      setPhase("error");
      setStatus(message);
      toast("Recording Error", message, "error");
    },
  });

  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken && !token) setToken(storedToken);
  }, [token]);

  useEffect(() => {
    if (token) void loadSnapshot(token);
  }, [token, loadSnapshot]);

  const submitAuth = async () => {
    const isSignIn = authMode === "signin";
    setBusyLabel(isSignIn ? "Signing in..." : "Creating account...");
    setStatus("");
    try {
      const response = await fetch(`/api/v1/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(authMode === "signup" && displayName.trim() ? { displayName: displayName.trim() } : {}), platform: "web", installationId: getInstallationId(), deviceLabel: "Koe Web" }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const payload = (await response.json()) as AuthResponse;
      setStoredToken(payload.session.token);
      setToken(payload.session.token);
      setPassword("");
      if (authMode === "signup") {
        void requestVerification(payload.session.token);
      }
      const completeMsg = isSignIn ? "Signed in successfully. Welcome back!" : "Account created. Verification email sent.";
      setStatus(completeMsg);
      toast(isSignIn ? "Welcome Back" : "Account Created", completeMsg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Authentication failed.";
      setStatus(errorMsg);
      toast("Authentication Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  };

  const signOut = async () => {
    setBusyLabel("Signing out...");
    try {
      if (token) await fetch("/api/v1/auth/signout", { method: "POST", headers: authHeaders(token) });
    } finally {
      setToken(null);
      setSnapshot(null);
      setStoredToken(null);
      setTranscript("");
      setUploadRawTranscript("");
      setUploadRefinedTranscript("");
      setPhase("idle");
      setUploadPhase("idle");
      setBusyLabel("");
      setStatus("Signed out.");
      toast("Signed Out", "You have successfully signed out of Koe.", "success");
    }
  };

  const switchMode = async (defaultMode: AccountMode) => {
    if (!token || !snapshot || snapshot.user.defaultMode === defaultMode) return;
    setBusyLabel(`Switching to ${defaultMode.toUpperCase()}...`);
    try {
      const response = await fetch("/api/v1/account/mode", { method: "PATCH", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ defaultMode }) });
      if (!response.ok) throw new Error(await readApiError(response));
      await loadSnapshot(token);
      const switchMsg = `${defaultMode.toUpperCase()} mode selected.`;
      setStatus(switchMsg);
      toast("Mode Changed", switchMsg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not switch mode.";
      setStatus(errorMsg);
      toast("Mode Switch Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  };

  if (!token || !snapshot) {
    return (
      <AuthPanel authMode={authMode} email={email} displayName={displayName} password={password} busyLabel={busyLabel} status={status} onAuthModeChange={setAuthMode} onEmailChange={setEmail} onDisplayNameChange={setDisplayName} onPasswordChange={setPassword} onSubmit={() => void submitAuth()} onPasswordReset={() => void requestPasswordReset()} />
    );
  }

  const accountPanel = <AccountPanel snapshot={snapshot} modeCopy={modeCopy} busyLabel={busyLabel} onRefresh={() => void loadSnapshot()} onRequestVerification={() => void requestVerification()} onSignOut={() => void signOut()} onSwitchMode={(mode) => void switchMode(mode)} onStartCheckout={(planCode) => void startCheckout(planCode)} onChangePlan={(planCode) => void changePlan(planCode)} onCancelPlan={() => void cancelPlan()} />;
  const recorderPanel = <RecorderPanel phase={phase} transcript={transcript} inputLevel={recorder.inputLevel} busyLabel={busyLabel} isSupported={recorder.isSupported} copyState={copyState} onRecordToggle={phase === "recording" ? recorder.stopRecording : () => void recorder.startRecording()} onCopy={() => void copyText(transcript)} onClear={() => { setTranscript(""); setPhase("idle"); setStatus("Transcript cleared."); toast("Cleared", "Recorder transcript cleared.", "info"); }} />;
  const uploadPanel = <AudioUploadPanel phase={uploadPhase} rawTranscript={uploadRawTranscript} refinedTranscript={uploadRefinedTranscript} busyLabel={busyLabel} copyState={copyState} defaultEnhanceText={snapshot.settings.enhanceText !== false} onUpload={(file, audioSeconds, enhanceText) => void processUploadedAudio(file, audioSeconds, enhanceText)} onCopyRaw={() => void copyText(uploadRawTranscript)} onCopyRefined={() => void copyText(uploadRefinedTranscript || uploadRawTranscript)} onClear={() => { setUploadRawTranscript(""); setUploadRefinedTranscript(""); setUploadPhase("idle"); setStatus("Upload cleared."); toast("Cleared", "Upload panel cleared.", "info"); }} />;
  const historyPanel = <HistoryPanel history={snapshot.recentHistory} copiedEntryId={copiedEntryId} onCopyEntry={(id, text) => void copyText(text, id)} />;

  return (
    <section className="max-w-[1600px] mx-auto w-full border-x border-[var(--color-zinc)] py-4 xl:py-6 px-4 md:px-8 relative z-10 flex flex-col xl:h-[calc(100vh-135px)] xl:overflow-hidden">
      <WebAppTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="md:hidden space-y-4">
        {activeTab === "record" ? recorderPanel : null}
        {activeTab === "upload" ? uploadPanel : null}
        {activeTab === "account" ? accountPanel : null}
        {activeTab === "history" ? historyPanel : null}
      </div>

      <div className="hidden md:grid md:grid-cols-[0.85fr_1.15fr] xl:grid-cols-[0.85fr_1.15fr_1fr] gap-8 xl:h-full xl:overflow-hidden">
        <div className="xl:h-full xl:overflow-y-auto pr-2 pb-6 no-scrollbar">
          {accountPanel}
        </div>
        <div className="space-y-4 xl:h-full xl:overflow-y-auto pr-2 pb-6 no-scrollbar">
          {recorderPanel}
          {uploadPanel}
          <div className="xl:hidden">
            {historyPanel}
          </div>
        </div>
        <div className="hidden xl:block xl:h-full xl:overflow-y-auto pr-2 pb-6 no-scrollbar">
          {historyPanel}
        </div>
      </div>
    </section>
  );
}
