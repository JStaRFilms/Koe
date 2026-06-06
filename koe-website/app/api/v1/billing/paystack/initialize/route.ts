import { NextResponse } from "next/server";
import { z } from "zod";
import {
  billingPlanCodeSchema,
  createPendingBillingSubscription,
  getBillingPlan,
  paystackPlanCode,
  publicPlan,
} from "@/lib/server/billing";
import { getAuthContext } from "@/lib/server/auth";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { createPaystackReference, initializePaystackTransaction } from "@/lib/server/paystack";

export const runtime = "nodejs";

const initializeSchema = z.object({ planCode: billingPlanCodeSchema });

function appBaseUrl(request: Request) {
  const configured = process.env.KOE_APP_BASE_URL || process.env.KOE_APP_URL;
  return (configured || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = initializeSchema.parse(await readJson<unknown>(request));
    const plan = await getBillingPlan(body.planCode);
    const reference = createPaystackReference(plan.code);
    await createPendingBillingSubscription(auth.user.id, plan.id, reference);

    const checkout = await initializePaystackTransaction({
      email: auth.user.email,
      amountKobo: Number(plan.amount_kobo),
      planCode: plan.code,
      paystackPlanCode: paystackPlanCode(plan),
      reference,
      callbackUrl: `${appBaseUrl(request)}/app?billing=paystack&reference=${encodeURIComponent(reference)}`,
      metadata: {
        koeUserId: auth.user.id,
        koePlanCode: plan.code,
        koeSubscriptionReference: reference,
      },
    });

    return NextResponse.json({ checkout, plan: publicPlan(plan) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid billing checkout request.", 400);
    }
    return handleApiError(error);
  }
}
