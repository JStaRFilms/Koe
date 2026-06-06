CREATE TABLE IF NOT EXISTS billing_plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  from_plan_code text NOT NULL
    CHECK (from_plan_code IN ('managed_lite', 'managed_plus', 'managed_pro')),
  to_plan_code text NOT NULL
    CHECK (to_plan_code IN ('managed_lite', 'managed_plus', 'managed_pro', 'managed_free')),
  change_type text NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancel')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'canceled')),
  effective_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_plan_changes_user_idx
  ON billing_plan_changes (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS billing_plan_changes_pending_user_unique_idx
  ON billing_plan_changes (user_id)
  WHERE status = 'pending';
