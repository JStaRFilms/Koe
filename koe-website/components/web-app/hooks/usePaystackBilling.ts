import { useCallback, useEffect, useRef } from "react";
import { BillingPlanCode } from "../types";
import { authHeaders, readApiError } from "../webAppUtils";

type PaystackBillingArgs = {
  token: string | null;
  loadSnapshot: (activeToken?: string | null) => Promise<void>;
  setBusyLabel: (label: string) => void;
  setStatus: (status: string) => void;
};

export function usePaystackBilling({ token, loadSnapshot, setBusyLabel, setStatus }: PaystackBillingArgs) {
  const verifiedReferenceRef = useRef("");

  const startCheckout = useCallback(async (planCode: BillingPlanCode) => {
    if (!token) return;
    setBusyLabel("Preparing Paystack checkout...");
    try {
      const response = await fetch("/api/v1/billing/paystack/initialize", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        checkout?: { authorization_url?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload.checkout?.authorization_url) {
        throw new Error(payload.error?.message || `Request failed with HTTP ${response.status}.`);
      }
      setStatus("Opening Paystack checkout...");
      window.location.href = payload.checkout.authorization_url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start Paystack checkout.");
      setBusyLabel("");
    }
  }, [setBusyLabel, setStatus, token]);

  const verifyCheckoutReference = useCallback(async (reference: string) => {
    if (!token || verifiedReferenceRef.current === reference) return;
    verifiedReferenceRef.current = reference;
    setBusyLabel("Verifying Paystack payment...");
    try {
      const response = await fetch("/api/v1/billing/paystack/verify", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      window.history.replaceState({}, "", "/app");
      await loadSnapshot(token);
      setStatus("Payment verified. Managed paid quota is active.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not verify Paystack payment yet.");
    } finally {
      setBusyLabel("");
    }
  }, [loadSnapshot, setBusyLabel, setStatus, token]);

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (params.get("billing") === "paystack" && reference) {
      void verifyCheckoutReference(reference);
    }
  }, [token, verifyCheckoutReference]);

  return { startCheckout };
}
