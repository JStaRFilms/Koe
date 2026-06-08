import { authHeaders, readApiError } from "../webAppUtils";
import { useToast } from "../Toast";

type AuthEmailFlowOptions = {
  email: string;
  token: string | null;
  setBusyLabel: (label: string) => void;
  setStatus: (status: string) => void;
};

export function useAuthEmailFlows({ email, token, setBusyLabel, setStatus }: AuthEmailFlowOptions) {
  const { toast } = useToast();

  const requestPasswordReset = async () => {
    setBusyLabel("Sending reset link...");
    try {
      const response = await fetch("/api/v1/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const msg = "If that email exists, a reset link has been sent.";
      setStatus(msg);
      toast("Reset Email Sent", msg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not send reset email.";
      setStatus(errorMsg);
      toast("Reset Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  };

  const requestVerification = async (activeToken = token) => {
    if (!activeToken) {
      setStatus("Sign in before requesting verification.");
      return;
    }
    setBusyLabel("Sending verification email...");
    try {
      const response = await fetch("/api/v1/auth/request-email-verification", {
        method: "POST",
        headers: authHeaders(activeToken),
      });
      const payload = (await response.json().catch(() => ({}))) as { sent?: boolean; email?: string };
      if (!response.ok) throw new Error(await readApiError(response));
      const msg = payload.sent 
        ? `Verification email sent to ${payload.email || "your email"}.` 
        : "Verification token created, but email delivery is not configured.";
      setStatus(msg);
      toast(payload.sent ? "Verification Email Sent" : "Verification Inactive", msg, payload.sent ? "success" : "warning");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not send verification email.";
      setStatus(errorMsg);
      toast("Verification Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  };

  return { requestPasswordReset, requestVerification };
}
