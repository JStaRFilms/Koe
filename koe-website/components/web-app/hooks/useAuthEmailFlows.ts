import { authHeaders, readApiError } from "../webAppUtils";

type AuthEmailFlowOptions = {
  email: string;
  token: string | null;
  setBusyLabel: (label: string) => void;
  setStatus: (status: string) => void;
};

export function useAuthEmailFlows({ email, token, setBusyLabel, setStatus }: AuthEmailFlowOptions) {
  const requestPasswordReset = async () => {
    setBusyLabel("Sending reset link...");
    try {
      const response = await fetch("/api/v1/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      setStatus("If that email exists, a reset link has been sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send reset email.");
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
      setStatus(payload.sent ? `Verification email sent to ${payload.email || "your email"}.` : "Verification token created, but email delivery is not configured.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send verification email.");
    } finally {
      setBusyLabel("");
    }
  };

  return { requestPasswordReset, requestVerification };
}
