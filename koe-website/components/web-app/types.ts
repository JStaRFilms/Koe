export type AccountMode = "byok" | "managed";
export type AppPhase = "idle" | "recording" | "processing" | "done" | "error";
export type AuthMode = "signin" | "signup" | "reset";
export type WebAppTab = "record" | "account" | "history";
export type BillingPlanCode = "managed_lite" | "managed_plus" | "managed_pro";
export type BillingPlanTarget = BillingPlanCode | "managed_free";

export type AuthResponse = {
  user: { id: string; email: string; displayName: string | null; defaultMode: AccountMode; emailVerifiedAt: string | null };
  session: { token: string; expiresAt: string };
};

export type Snapshot = {
  user: { id: string; email: string; displayName: string | null; defaultMode: AccountMode; emailVerifiedAt: string | null };
  resolvedMode: { mode: AccountMode; available: boolean; reason: string };
  capabilities: {
    byok: { available: boolean; provider: "groq"; last4: string | null; updatedAt: string | null };
    managed: {
      available: boolean;
      status: string;
      source: string | null;
      planCode: string | null;
      periodEndsAt: string | null;
      usage: {
        audioSecondsUsed: number;
        audioSecondsLimit: number;
        requestCountUsed: number;
        requestCountLimit: number;
        quotaWindow?: "daily" | "monthly";
        guaranteedFloorSeconds?: number;
        bonusCeilingSeconds?: number;
        activeManagedUsers24h?: number;
        safeDailyPoolSeconds?: number;
        source?: "dynamic_free" | "allocation" | "paid";
      };
    };
  };
  billing: {
    provider: "paystack";
    subscription: {
      id: string;
      planCode: BillingPlanCode;
      planName: string;
      status: "pending" | "active" | "past_due" | "canceled" | "disabled";
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      lastPaymentReference: string | null;
    } | null;
    plans: Array<{
      code: BillingPlanCode;
      name: string;
      currency: "NGN";
      amountKobo: number;
      monthlyAudioSeconds: number;
      monthlyRequestCount: number;
    }>;
    pendingPlanChange: {
      id: string;
      fromPlanCode: BillingPlanCode;
      toPlanCode: BillingPlanTarget;
      changeType: "upgrade" | "downgrade" | "cancel";
      status: "pending" | "applied" | "canceled";
      effectiveAt: string | null;
    } | null;
  };
  settings: {
    language: string;
    promptStyle: string;
    customPrompt: string;
    enhanceText: boolean;
    model: string;
  };
  recentHistory: Array<{
    id: string;
    mode: AccountMode;
    rawText: string;
    refinedText: string | null;
    audioSeconds: number;
    createdAt: string | null;
  }>;
};

export type ApiErrorPayload = { error?: { code?: string; message?: string } };
