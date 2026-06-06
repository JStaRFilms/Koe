import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { cancelPendingPlanChanges, createScheduledPlanChange, getInternalActiveSubscription } from "@/lib/server/billing-plan-changes";
import { apiError, handleApiError } from "@/lib/server/errors";
import { disablePaystackSubscription } from "@/lib/server/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const current = await getInternalActiveSubscription(auth.user.id);
    if (!current) return apiError("BAD_REQUEST", "No active paid plan was found.", 409);

    const planChange = await createScheduledPlanChange({
      userId: auth.user.id,
      subscriptionId: current.id,
      fromPlanCode: current.plan_code,
      toPlanCode: "managed_free",
      changeType: "cancel",
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
    return handleApiError(error);
  }
}
