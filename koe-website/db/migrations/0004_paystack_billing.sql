CREATE TABLE IF NOT EXISTS billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE
    CHECK (code IN ('managed_lite', 'managed_plus', 'managed_pro')),
  provider text NOT NULL DEFAULT 'paystack' CHECK (provider = 'paystack'),
  provider_plan_code text,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  amount_kobo integer NOT NULL CHECK (amount_kobo > 0),
  monthly_audio_seconds integer NOT NULL CHECK (monthly_audio_seconds > 0),
  monthly_request_count integer NOT NULL CHECK (monthly_request_count > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES billing_plans(id),
  provider text NOT NULL DEFAULT 'paystack' CHECK (provider = 'paystack'),
  provider_customer_code text,
  provider_subscription_code text,
  provider_email_token text,
  status text NOT NULL
    CHECK (status IN ('pending', 'active', 'past_due', 'canceled', 'disabled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_subscriptions_user_idx
  ON billing_subscriptions (user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_provider_subscription_unique_idx
  ON billing_subscriptions (provider, provider_subscription_code)
  WHERE provider_subscription_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_active_user_unique_idx
  ON billing_subscriptions (user_id)
  WHERE status IN ('pending', 'active', 'past_due');

CREATE TABLE IF NOT EXISTS billing_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paystack' CHECK (provider = 'paystack'),
  event_type text NOT NULL,
  reference text,
  subscription_code text,
  payload_hash text NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_payment_events_reference_idx
  ON billing_payment_events (provider, reference)
  WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_events_subscription_idx
  ON billing_payment_events (provider, subscription_code)
  WHERE subscription_code IS NOT NULL;

INSERT INTO billing_plans (
  code, name, currency, amount_kobo, monthly_audio_seconds, monthly_request_count
)
VALUES
  ('managed_lite', 'Managed Lite', 'NGN', 500000, 36000, 1000),
  ('managed_plus', 'Managed Plus', 'NGN', 900000, 90000, 2500),
  ('managed_pro', 'Managed Pro', 'NGN', 1500000, 144000, 4000)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  currency = EXCLUDED.currency,
  amount_kobo = EXCLUDED.amount_kobo,
  monthly_audio_seconds = EXCLUDED.monthly_audio_seconds,
  monthly_request_count = EXCLUDED.monthly_request_count,
  updated_at = now();
