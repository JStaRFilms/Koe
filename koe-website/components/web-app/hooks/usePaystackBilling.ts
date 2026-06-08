import { useCallback, useEffect, useRef } from "react";
import { BillingPlanCode } from "../types";
import { authHeaders, readApiError } from "../webAppUtils";
import { useToast } from "../Toast";

type PaystackBillingArgs = {
  token: string | null;
  loadSnapshot: (activeToken?: string | null) => Promise<void>;
  setBusyLabel: (label: string) => void;
  setStatus: (status: string) => void;
};

export function usePaystackBilling({ token, loadSnapshot, setBusyLabel, setStatus }: PaystackBillingArgs) {
  const { toast } = useToast();
  const verifiedReferenceRef = useRef("");
  const startedCheckoutRef = useRef("");

  const openCheckout = useCallback((url: string) => {
    setStatus("Opening Paystack checkout...");
    window.location.href = url;
  }, [setStatus]);

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
      openCheckout(payload.checkout.authorization_url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not start Paystack checkout.";
      setStatus(errorMsg);
      toast("Checkout Error", errorMsg, "error");
      setBusyLabel("");
    }
  }, [openCheckout, setBusyLabel, setStatus, token, toast]);

  const changePlan = useCallback(async (planCode: BillingPlanCode) => {
    if (!token) return;
    setBusyLabel("Updating managed plan...");
    try {
      const response = await fetch("/api/v1/billing/paystack/change-plan", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const payload = (await response.json().catch(() => ({}))) as {
        action?: "checkout" | "scheduled";
        checkout?: { authorization_url?: string };
      };
      if (payload.action === "checkout" && payload.checkout?.authorization_url) {
        openCheckout(payload.checkout.authorization_url);
        return;
      }
      await loadSnapshot(token);
      const msg = "Plan change scheduled for the next billing period.";
      setStatus(msg);
      toast("Plan Scheduled", msg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not update managed plan.";
      setStatus(errorMsg);
      toast("Plan Update Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  }, [loadSnapshot, openCheckout, setBusyLabel, setStatus, token, toast]);

  const cancelPlan = useCallback(async () => {
    if (!token) return;
    setBusyLabel("Canceling paid renewal...");
    try {
      const response = await fetch("/api/v1/billing/paystack/cancel", {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await loadSnapshot(token);
      const msg = "Paid renewal canceled. Your quota remains available until the period ends.";
      setStatus(msg);
      toast("Subscription Canceled", msg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not cancel paid renewal.";
      setStatus(errorMsg);
      toast("Cancellation Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  }, [loadSnapshot, setBusyLabel, setStatus, token, toast]);

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
      const msg = "Payment verified. Managed paid quota is active.";
      setStatus(msg);
      toast("Payment Verified", msg, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not verify Paystack payment yet.";
      setStatus(errorMsg);
      toast("Verification Failed", errorMsg, "error");
    } finally {
      setBusyLabel("");
    }
  }, [loadSnapshot, setBusyLabel, setStatus, token, toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (params.get("billing") === "paystack" && reference) {
      if (!token) {
        setStatus("Sign in to finish verifying your Paystack payment.");
        return;
      }
      void verifyCheckoutReference(reference);
      return;
    }

    const checkoutPlan = parseCheckoutPlan(params.get("checkout"));
    if (!checkoutPlan) return;
    if (!token) {
      setStatus("Sign in or create an account to continue managed plan checkout.");
      return;
    }
    if (startedCheckoutRef.current === checkoutPlan) return;
    startedCheckoutRef.current = checkoutPlan;
    void startCheckout(checkoutPlan);
  }, [setStatus, startCheckout, token, verifyCheckoutReference]);

  return { startCheckout, changePlan, cancelPlan };
}

function parseCheckoutPlan(value: string | null): BillingPlanCode | null {
  if (value === "managed_lite" || value === "managed_plus" || value === "managed_pro") {
    return value;
  }
  return null;
}
