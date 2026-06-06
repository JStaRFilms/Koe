import { createHash } from "node:crypto";
import {
  activateSubscription,
  billingPlanCodeSchema,
  getActiveBillingSubscription,
  getBillingPlan,
  publicPlan,
} from "./billing";
import { sql } from "./db";
import { ApiError } from "./errors";
import { PaystackTransactionData } from "./paystack";

export function extractPaystackMetadata(data: PaystackTransactionData) {
  if (typeof data.metadata === "string") {
    try {
      return JSON.parse(data.metadata) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return data.metadata && typeof data.metadata === "object"
    ? data.metadata as Record<string, unknown>
    : {};
}

export async function activatePaidPlanFromTransaction(data: PaystackTransactionData, expectedUserId?: string) {
  if (data.status !== "success") {
    throw new ApiError("BAD_REQUEST", "Paystack transaction is not successful.", 400);
  }

  const metadata = extractPaystackMetadata(data);
  const userId = typeof metadata.koeUserId === "string" ? metadata.koeUserId : "";
  const planCode = billingPlanCodeSchema.parse(metadata.koePlanCode);
  if (!userId) {
    throw new ApiError("BAD_REQUEST", "Transaction metadata is missing the Koe user.", 400);
  }
  if (expectedUserId && userId !== expectedUserId) {
    throw new ApiError("FORBIDDEN", "This transaction belongs to a different account.", 403);
  }

  const plan = await getBillingPlan(planCode);
  await activateSubscription({
    userId,
    plan,
    reference: data.reference,
    customerCode: data.customer?.customer_code || null,
    subscriptionCode: subscriptionCode(data.subscription),
    emailToken: subscriptionEmailToken(data.subscription),
    paidAt: data.paid_at || null,
  });

  return { plan: publicPlan(plan), subscription: await getActiveBillingSubscription(userId) };
}

export async function recordWebhookEvent(rawBody: string, eventType: string, data: PaystackTransactionData) {
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const result = await sql()`
    INSERT INTO billing_payment_events (event_type, reference, subscription_code, payload_hash)
    VALUES (${eventType}, ${data.reference || null}, ${subscriptionCode(data.subscription)}, ${payloadHash})
    ON CONFLICT (payload_hash) DO NOTHING
    RETURNING id
  `;
  return result.length > 0;
}

function subscriptionCode(value: PaystackTransactionData["subscription"]) {
  return typeof value === "string" ? value : value?.subscription_code || null;
}

function subscriptionEmailToken(value: PaystackTransactionData["subscription"]) {
  return typeof value === "object" ? value.email_token || null : null;
}
