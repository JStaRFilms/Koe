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
    WITH target AS (
      SELECT id, user_id, plan_id
      FROM billing_subscriptions
      WHERE provider_subscription_code = ${subscriptionCode}
        AND status IN ('pending', 'active', 'past_due')
      LIMIT 1
    ),
    pending_change AS (
      SELECT 1
      FROM billing_plan_changes
      WHERE user_id IN (SELECT user_id FROM target)
        AND subscription_id IN (SELECT id FROM target)
        AND status = 'pending'
      LIMIT 1
    ),
    current_subscription AS (
      SELECT id
      FROM billing_subscriptions
      WHERE user_id IN (SELECT user_id FROM target)
        AND status IN ('pending', 'active', 'past_due')
      ORDER BY updated_at DESC
      LIMIT 1
    ),
    changed AS (
      UPDATE billing_subscriptions
      SET status = 'disabled', updated_at = now()
      WHERE id IN (SELECT id FROM target)
        AND NOT EXISTS (SELECT 1 FROM pending_change)
        AND id IN (SELECT id FROM current_subscription)
      RETURNING user_id, plan_id
    )
    UPDATE managed_allocations
    SET status = 'suspended', updated_at = now()
    WHERE source = 'paystack'
      AND status = 'active'
      AND user_id IN (SELECT user_id FROM changed)
      AND plan_code IN (
        SELECT billing_plans.code
        FROM billing_plans
        JOIN changed ON changed.plan_id = billing_plans.id
      )
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
