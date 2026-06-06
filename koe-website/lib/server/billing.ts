import { z } from "zod";
import { one, sql, toIso } from "./db";
import { ApiError } from "./errors";

export const billingPlanCodeSchema = z.enum(["managed_lite", "managed_plus", "managed_pro"]);
export type BillingPlanCode = z.infer<typeof billingPlanCodeSchema>;

export type BillingPlanRow = {
  id: string;
  code: BillingPlanCode;
  provider_plan_code: string | null;
  name: string;
  currency: "NGN";
  amount_kobo: number;
  monthly_audio_seconds: number;
  monthly_request_count: number;
  active: boolean;
};

type BillingSubscriptionRow = {
  id: string;
  plan_code: BillingPlanCode;
  plan_name: string;
  status: "pending" | "active" | "past_due" | "canceled" | "disabled";
  current_period_start: string | null;
  current_period_end: string | null;
  last_payment_reference: string | null;
};

const ENV_PLAN_CODES: Record<BillingPlanCode, string> = {
  managed_lite: "PAYSTACK_PLAN_MANAGED_LITE",
  managed_plus: "PAYSTACK_PLAN_MANAGED_PLUS",
  managed_pro: "PAYSTACK_PLAN_MANAGED_PRO",
};

export async function listBillingPlans() {
  const rows = await sql()`SELECT * FROM billing_plans WHERE active = true ORDER BY amount_kobo ASC`;
  return rows.map((row) => publicPlan(row as BillingPlanRow));
}

export async function getBillingPlan(code: BillingPlanCode) {
  const row = one<BillingPlanRow>(
    await sql()`SELECT * FROM billing_plans WHERE code = ${code} AND active = true LIMIT 1`,
  );
  if (!row) throw new ApiError("BAD_REQUEST", "Unknown billing plan.", 400);
  return row;
}

export function publicPlan(row: BillingPlanRow) {
  return {
    code: row.code,
    name: row.name,
    currency: row.currency,
    amountKobo: Number(row.amount_kobo),
    monthlyAudioSeconds: Number(row.monthly_audio_seconds),
    monthlyRequestCount: Number(row.monthly_request_count),
  };
}

export function paystackPlanCode(plan: BillingPlanRow) {
  const envCode = process.env[ENV_PLAN_CODES[plan.code]]?.trim();
  const code = envCode || plan.provider_plan_code || "";
  if (!code) {
    throw new ApiError("SERVER_MISCONFIGURED", `${plan.name} Paystack plan code is not configured.`, 500);
  }
  return code;
}

export async function getActiveBillingSubscription(userId: string) {
  const row = one<BillingSubscriptionRow>(
    await sql()`
      SELECT
        billing_subscriptions.id,
        billing_subscriptions.status,
        billing_subscriptions.current_period_start,
        billing_subscriptions.current_period_end,
        billing_subscriptions.last_payment_reference,
        billing_plans.code AS plan_code,
        billing_plans.name AS plan_name
      FROM billing_subscriptions
      JOIN billing_plans ON billing_plans.id = billing_subscriptions.plan_id
      WHERE billing_subscriptions.user_id = ${userId}
        AND billing_subscriptions.status IN ('pending', 'active', 'past_due')
      ORDER BY billing_subscriptions.updated_at DESC
      LIMIT 1
    `,
  );
  return row ? publicSubscription(row) : null;
}

export function publicSubscription(row: BillingSubscriptionRow) {
  return {
    id: row.id,
    planCode: row.plan_code,
    planName: row.plan_name,
    status: row.status,
    currentPeriodStart: toIso(row.current_period_start),
    currentPeriodEnd: toIso(row.current_period_end),
    lastPaymentReference: row.last_payment_reference,
  };
}

export async function createPendingBillingSubscription(userId: string, planId: string, reference: string) {
  const current = one<{ id: string; status: string }>(
    await sql()`
      SELECT id, status FROM billing_subscriptions
      WHERE user_id = ${userId} AND status IN ('pending', 'active', 'past_due')
      LIMIT 1
    `,
  );
  if (current?.status === "active") {
    throw new ApiError("BAD_REQUEST", "This account already has an active paid plan.", 409);
  }
  if (current) {
    await sql()`
      UPDATE billing_subscriptions
      SET plan_id = ${planId}, last_payment_reference = ${reference}, status = 'pending', updated_at = now()
      WHERE id = ${current.id}
    `;
    return current.id;
  }
  const inserted = one<{ id: string }>(
    await sql()`
      INSERT INTO billing_subscriptions (user_id, plan_id, status, last_payment_reference)
      VALUES (${userId}, ${planId}, 'pending', ${reference})
      RETURNING id
    `,
  );
  return inserted?.id || "";
}

export async function activateSubscription(args: {
  userId: string; plan: BillingPlanRow; reference: string; customerCode: string | null;
  subscriptionCode: string | null; emailToken: string | null; paidAt: string | null;
}) {
  const periodStart = args.paidAt ? new Date(args.paidAt) : new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  const subscription = one<{ id: string }>(
    await sql()`
      INSERT INTO billing_subscriptions (
        user_id, plan_id, status, provider_customer_code, provider_subscription_code,
        provider_email_token, current_period_start, current_period_end, last_payment_reference
      )
      VALUES (
        ${args.userId}, ${args.plan.id}, 'active', ${args.customerCode}, ${args.subscriptionCode},
        ${args.emailToken}, ${periodStart.toISOString()}, ${periodEnd.toISOString()}, ${args.reference}
      )
      ON CONFLICT (user_id) WHERE status IN ('pending', 'active', 'past_due')
      DO UPDATE SET
        plan_id = EXCLUDED.plan_id, status = 'active',
        provider_customer_code = COALESCE(EXCLUDED.provider_customer_code, billing_subscriptions.provider_customer_code),
        provider_subscription_code = COALESCE(EXCLUDED.provider_subscription_code, billing_subscriptions.provider_subscription_code),
        provider_email_token = COALESCE(EXCLUDED.provider_email_token, billing_subscriptions.provider_email_token),
        current_period_start = EXCLUDED.current_period_start, current_period_end = EXCLUDED.current_period_end,
        last_payment_reference = EXCLUDED.last_payment_reference, updated_at = now()
      RETURNING id
    `,
  );
  await syncManagedAllocation(args.userId, args.plan, periodStart, periodEnd);
  return subscription?.id || "";
}

async function syncManagedAllocation(userId: string, plan: BillingPlanRow, start: Date, end: Date) {
  await sql()`
    UPDATE managed_allocations
    SET status = 'canceled', updated_at = now()
    WHERE user_id = ${userId} AND source = 'paystack' AND status = 'active'
  `;
  await sql()`
    INSERT INTO managed_allocations (
      user_id, status, source, plan_code, period_start, period_end,
      monthly_audio_seconds, monthly_request_count
    )
    VALUES (
      ${userId}, 'active', 'paystack', ${plan.code}, ${start.toISOString()}, ${end.toISOString()},
      ${Number(plan.monthly_audio_seconds)}, ${Number(plan.monthly_request_count)}
    )
  `;
}
