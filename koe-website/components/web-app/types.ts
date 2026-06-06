export type AccountMode = "byok" | "managed";
export type AppPhase = "idle" | "recording" | "processing" | "done" | "error";
export type AuthMode = "signin" | "signup";
export type WebAppTab = "record" | "account" | "history";

export type AuthResponse = {
  user: { id: string; email: string; displayName: string | null; defaultMode: AccountMode };
  session: { token: string; expiresAt: string };
};

export type Snapshot = {
  user: { id: string; email: string; displayName: string | null; defaultMode: AccountMode };
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
