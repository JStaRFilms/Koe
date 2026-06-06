import { z } from "zod";
import { BillingPlanCode, billingPlanCodeSchema } from "./billing";
import { one, sql, toIso } from "./db";
import { ApiError } from "./errors";

export const billingPlanTargetSchema = z.union([billingPlanCodeSchema, z.literal("managed_free")]);
export type BillingPlanTarget = z.infer<typeof billingPlanTargetSchema>;
export type BillingChangeType = "upgrade" | "downgrade" | "cancel";

const PLAN_RANK: Record<BillingPlanTarget, number> = {
  managed_free: 0,
  managed_lite: 1,
  managed_plus: 2,
  managed_pro: 3,
};

type InternalSubscriptionRow = {
  id: string;
  user_id: string;
  status: "pending" | "active" | "past_due" | "canceled" | "disabled";
  provider_subscription_code: string | null;
  provider_email_token: string | null;
  current_period_end: string | null;
  plan_code: BillingPlanCode;
};

type PlanChangeRow = {
  id: string;
  from_plan_code: BillingPlanCode;
  to_plan_code: BillingPlanTarget;
  change_type: BillingChangeType;
  status: "pending" | "applied" | "canceled";
  effective_at: string;
};

export function comparePlanRank(current: BillingPlanTarget, target: BillingPlanTarget) {
  return PLAN_RANK[target] - PLAN_RANK[current];
}

export async function getInternalActiveSubscription(userId: string) {
  return one<InternalSubscriptionRow>(
    await sql()`
      SELECT billing_subscriptions.*, billing_plans.code AS plan_code
      FROM billing_subscriptions
      JOIN billing_plans ON billing_plans.id = billing_subscriptions.plan_id
      WHERE billing_subscriptions.user_id = ${userId}
        AND billing_subscriptions.status IN ('pending', 'active', 'past_due')
      ORDER BY billing_subscriptions.updated_at DESC
      LIMIT 1
    `,
  );
}

export async function getPendingPlanChange(userId: string) {
  const row = one<PlanChangeRow>(
    await sql()`
      SELECT id, from_plan_code, to_plan_code, change_type, status, effective_at
      FROM billing_plan_changes
      WHERE user_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );
  return row ? publicPlanChange(row) : null;
}

export async function applyDuePlanChanges(userId: string) {
  await sql()`
    WITH due_changes AS (
      UPDATE billing_plan_changes
      SET status = 'applied', updated_at = now()
      WHERE user_id = ${userId}
        AND status = 'pending'
        AND effective_at <= now()
      RETURNING subscription_id
    ),
    disabled_subscriptions AS (
      UPDATE billing_subscriptions
      SET status = 'disabled', updated_at = now()
      WHERE id IN (SELECT subscription_id FROM due_changes)
        AND status IN ('pending', 'active', 'past_due')
      RETURNING user_id
    )
    UPDATE managed_allocations
    SET status = 'canceled', updated_at = now()
    WHERE source = 'paystack'
      AND status = 'active'
      AND period_end <= now()
      AND user_id IN (SELECT user_id FROM disabled_subscriptions)
  `;
}

export async function createScheduledPlanChange(args: {
  userId: string;
  subscriptionId: string;
  fromPlanCode: BillingPlanCode;
  toPlanCode: BillingPlanTarget;
  changeType: "downgrade" | "cancel";
  effectiveAt: string;
}) {
  if (args.changeType === "cancel" && args.toPlanCode !== "managed_free") {
    throw new ApiError("BAD_REQUEST", "Cancel changes must return to free.", 400);
  }
  const row = one<PlanChangeRow>(
    await sql()`
      INSERT INTO billing_plan_changes (
        user_id, subscription_id, from_plan_code, to_plan_code, change_type, status, effective_at
      )
      VALUES (
        ${args.userId}, ${args.subscriptionId}, ${args.fromPlanCode}, ${args.toPlanCode},
        ${args.changeType}, 'pending', ${args.effectiveAt}
      )
      ON CONFLICT (user_id) WHERE status = 'pending'
      DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id,
        from_plan_code = EXCLUDED.from_plan_code,
        to_plan_code = EXCLUDED.to_plan_code,
        change_type = EXCLUDED.change_type,
        effective_at = EXCLUDED.effective_at,
        updated_at = now()
      RETURNING id, from_plan_code, to_plan_code, change_type, status, effective_at
    `,
  );
  if (!row) throw new ApiError("INTERNAL_ERROR", "Could not schedule billing change.", 500);
  return publicPlanChange(row);
}

export async function cancelPendingPlanChanges(userId: string) {
  await sql()`
    UPDATE billing_plan_changes
    SET status = 'canceled', updated_at = now()
    WHERE user_id = ${userId} AND status = 'pending'
  `;
}

function publicPlanChange(row: PlanChangeRow) {
  return {
    id: row.id,
    fromPlanCode: row.from_plan_code,
    toPlanCode: row.to_plan_code,
    changeType: row.change_type,
    status: row.status,
    effectiveAt: toIso(row.effective_at),
  };
}
