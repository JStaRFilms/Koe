import { NextResponse } from "next/server";
import { getCapabilities, snapshotResolvedMode } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { getActiveBillingSubscription, listBillingPlans } from "@/lib/server/billing";
import { applyDuePlanChanges, getPendingPlanChange } from "@/lib/server/billing-plan-changes";
import { one, sql, toIso } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

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
      SELECT id, request_id, mode, provider, model, raw_text, refined_text, audio_seconds, created_at
      FROM transcript_history
      WHERE user_id = ${auth.user.id}
      ORDER BY created_at DESC
      LIMIT 10
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
      recentHistory: history.map((item) => ({
        id: String(item.id),
        requestId: String(item.request_id),
        mode: item.mode,
        provider: item.provider,
        model: item.model,
        rawText: item.raw_text,
        refinedText: item.refined_text,
        audioSeconds: Number(item.audio_seconds || 0),
        createdAt: toIso(item.created_at),
      })),
      policy: { mobilePurchaseUiEnabled: false },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
