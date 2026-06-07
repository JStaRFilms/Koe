import { NextResponse } from "next/server";
import { getCapabilities, snapshotResolvedMode } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { getActiveBillingSubscription, listBillingPlans } from "@/lib/server/billing";
import { applyDuePlanChanges, getPendingPlanChange } from "@/lib/server/billing-plan-changes";
import { one, sql, toIso } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

type HistoryRow = {
  id: string;
  request_id: string;
  client_session_id: string | null;
  mode: "byok" | "managed";
  provider: string;
  model: string | null;
  raw_text: string;
  refined_text: string | null;
  audio_seconds: string | number | null;
  created_at: string;
};

function compactTranscript(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupHistoryRows(rows: HistoryRow[]) {
  const groups = new Map<string, HistoryRow[]>();

  rows.forEach((row) => {
    const key = row.client_session_id?.trim() || String(row.request_id);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  });

  return Array.from(groups.entries()).slice(0, 10).map(([key, groupRows]) => {
    const latest = groupRows[0];
    const orderedRows = groupRows.slice().reverse();
    const rawText = compactTranscript(orderedRows.map((row) => row.raw_text));
    const hasRefinedText = orderedRows.some((row) => String(row.refined_text || "").trim());
    const refinedText = hasRefinedText
      ? compactTranscript(orderedRows.map((row) => row.refined_text || row.raw_text))
      : null;

    return {
      id: key,
      requestId: String(latest.request_id),
      requestIds: orderedRows.map((row) => String(row.request_id)),
      clientSessionId: latest.client_session_id || null,
      segmentCount: groupRows.length,
      mode: latest.mode,
      provider: latest.provider,
      model: latest.model,
      rawText,
      refinedText,
      audioSeconds: orderedRows.reduce((total, row) => total + Number(row.audio_seconds || 0), 0),
      createdAt: toIso(latest.created_at),
    };
  });
}

async function getBillingSnapshot(userId: string) {
  try {
    await applyDuePlanChanges(userId);
    const [subscription, plans, pendingPlanChange] = await Promise.all([
      getActiveBillingSubscription(userId),
      listBillingPlans(),
      getPendingPlanChange(userId),
    ]);
    return { subscription, plans, pendingPlanChange };
  } catch (error) {
    console.error("[AccountSnapshot] Billing data unavailable.", error);
    return { subscription: null, plans: [], pendingPlanChange: null };
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const db = sql();
    const settings = one<{
      language: string;
      prompt_style: string;
      custom_prompt: string;
      enhance_text: boolean;
      model: string;
      updated_at: string;
    }>(
      await db`
        INSERT INTO user_settings (user_id)
        VALUES (${auth.user.id})
        ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING language, prompt_style, custom_prompt, enhance_text, model, updated_at
      `,
    );

    const history = await db`
      SELECT id, request_id, client_session_id, mode, provider, model, raw_text, refined_text, audio_seconds, created_at
      FROM transcript_history
      WHERE user_id = ${auth.user.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const capabilities = await getCapabilities(auth.user.id);
    const resolvedMode = await snapshotResolvedMode(auth.user.id, auth.user.defaultMode);
    const billing = await getBillingSnapshot(auth.user.id);

    return NextResponse.json({
      user: auth.user,
      resolvedMode,
      capabilities: {
        byok: capabilities.byok,
        managed: capabilities.managed,
      },
      billing: {
        provider: "paystack",
        subscription: billing.subscription,
        plans: billing.plans,
        pendingPlanChange: billing.pendingPlanChange,
      },
      settings: {
        language: settings?.language || "auto",
        promptStyle: settings?.prompt_style || "Clean",
        customPrompt: settings?.custom_prompt || "",
        enhanceText: settings?.enhance_text ?? true,
        model: settings?.model || "whisper-large-v3-turbo",
        updatedAt: toIso(settings?.updated_at),
      },
      recentHistory: groupHistoryRows(history as HistoryRow[]),
      policy: { mobilePurchaseUiEnabled: false },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
