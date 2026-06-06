import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { billingPlanCodeSchema, getBillingPlan, paystackPlanCode, publicPlan } from "@/lib/server/billing";
import {
  cancelPendingPlanChanges,
  comparePlanRank,
  createScheduledPlanChange,
  getInternalActiveSubscription,
} from "@/lib/server/billing-plan-changes";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { createPaystackReference, disablePaystackSubscription, initializePaystackTransaction } from "@/lib/server/paystack";

export const runtime = "nodejs";

const changeSchema = z.object({ planCode: billingPlanCodeSchema });

function appBaseUrl(request: Request) {
  const configured = process.env.KOE_APP_BASE_URL || process.env.KOE_APP_URL;
  return (configured || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = changeSchema.parse(await readJson<unknown>(request));
    const current = await getInternalActiveSubscription(auth.user.id);
    if (!current) return apiError("BAD_REQUEST", "No active paid plan was found.", 409);

    const rankDelta = comparePlanRank(current.plan_code, body.planCode);
    if (rankDelta === 0) return apiError("BAD_REQUEST", "This is already your current plan.", 409);

    const targetPlan = await getBillingPlan(body.planCode);
    if (rankDelta > 0) {
      const reference = createPaystackReference(targetPlan.code);
      const checkout = await initializePaystackTransaction({
        email: auth.user.email,
        amountKobo: Number(targetPlan.amount_kobo),
        planCode: targetPlan.code,
        paystackPlanCode: paystackPlanCode(targetPlan),
        reference,
        callbackUrl: `${appBaseUrl(request)}/app?billing=paystack&reference=${encodeURIComponent(reference)}`,
        metadata: {
          koeUserId: auth.user.id,
          koePlanCode: targetPlan.code,
          koeChangeType: "upgrade",
          koePreviousSubscriptionId: current.id,
          koeSubscriptionReference: reference,
        },
      });
      return NextResponse.json({ action: "checkout", checkout, plan: publicPlan(targetPlan) });
    }

    const planChange = await createScheduledPlanChange({
      userId: auth.user.id,
      subscriptionId: current.id,
      fromPlanCode: current.plan_code,
      toPlanCode: body.planCode,
      changeType: "downgrade",
      effectiveAt: current.current_period_end || new Date().toISOString(),
    });
    if (current.provider_subscription_code && current.provider_email_token) {
      try {
        await disablePaystackSubscription(current.provider_subscription_code, current.provider_email_token);
      } catch (error) {
        await cancelPendingPlanChanges(auth.user.id);
        throw error;
      }
    }
    return NextResponse.json({ action: "scheduled", planChange });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("BAD_REQUEST", "Invalid plan change request.", 400);
    return handleApiError(error);
  }
}
