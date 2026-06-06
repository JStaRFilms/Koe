import { sql } from "./db";
import { activateSubscription, BillingPlanRow } from "./billing";

export async function markSubscriptionPastDue(subscriptionCode: string | null) {
  if (!subscriptionCode) return false;
  const rows = await sql()`
    UPDATE billing_subscriptions
    SET status = 'past_due', updated_at = now()
    WHERE provider_subscription_code = ${subscriptionCode}
      AND status IN ('pending', 'active', 'past_due')
    RETURNING id
  `;
  return rows.length > 0;
}

export async function disablePaidSubscription(subscriptionCode: string | null) {
  if (!subscriptionCode) return false;
  const rows = await sql()`
    WITH changed AS (
      UPDATE billing_subscriptions
      SET status = 'disabled', updated_at = now()
      WHERE provider_subscription_code = ${subscriptionCode}
        AND status IN ('pending', 'active', 'past_due')
      RETURNING user_id
    )
    UPDATE managed_allocations
    SET status = 'suspended', updated_at = now()
    WHERE source = 'paystack'
      AND status = 'active'
      AND user_id IN (SELECT user_id FROM changed)
    RETURNING id
  `;
  return rows.length > 0;
}

export async function renewPaidSubscription(subscriptionCode: string | null, reference: string, paidAt?: string | null) {
  if (!subscriptionCode) return false;
  const rows = await sql()`
    SELECT billing_subscriptions.user_id, billing_plans.*
    FROM billing_subscriptions
    JOIN billing_plans ON billing_plans.id = billing_subscriptions.plan_id
    WHERE billing_subscriptions.provider_subscription_code = ${subscriptionCode}
    LIMIT 1
  `;
  const row = rows[0] as (BillingPlanRow & { user_id: string }) | undefined;
  if (!row) return false;

  await activateSubscription({
    userId: row.user_id,
    plan: row,
    reference,
    customerCode: null,
    subscriptionCode,
    emailToken: null,
    paidAt: paidAt || null,
  });
  return true;
}
