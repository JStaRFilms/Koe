import { NextResponse } from "next/server";
import { z } from "zod";
import {
  activatePaidPlanFromTransaction,
  extractPaystackMetadata,
  recordWebhookEvent,
} from "@/lib/server/billing-paystack-events";
import { disablePaidSubscription, markSubscriptionPastDue, renewPaidSubscription } from "@/lib/server/billing-status";
import { apiError, handleApiError } from "@/lib/server/errors";
import { PaystackTransactionData, verifyPaystackSignature } from "@/lib/server/paystack";

export const runtime = "nodejs";

const webhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
      return apiError("FORBIDDEN", "Invalid Paystack webhook signature.", 403);
    }

    const event = webhookSchema.parse(JSON.parse(rawBody));
    const data = event.data as PaystackTransactionData;
    const shouldProcess = await recordWebhookEvent(rawBody, event.event, data);
    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.event === "charge.success") {
      const metadata = extractPaystackMetadata(data);
      const subscription = paystackSubscriptionCode(data);
      const reference = data.reference || `${event.event}-${Date.now()}`;
      if (metadata.koeUserId && metadata.koePlanCode) {
        await activatePaidPlanFromTransaction(data);
      } else {
        await renewPaidSubscription(subscription, reference, data.paid_at);
      }
    }

    if (event.event === "invoice.payment_failed") {
      await markSubscriptionPastDue(paystackSubscriptionCode(data));
    }

    if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
      await disablePaidSubscription(paystackSubscriptionCode(data));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return apiError("BAD_REQUEST", "Invalid Paystack webhook payload.", 400);
    }
    return handleApiError(error);
  }
}

function paystackSubscriptionCode(data: PaystackTransactionData) {
  if (typeof data.subscription === "string") {
    return data.subscription;
  }
  return data.subscription?.subscription_code || null;
}
