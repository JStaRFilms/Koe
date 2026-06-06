CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_algo text NOT NULL DEFAULT 'bcryptjs',
  display_name text,
  default_account_mode text NOT NULL DEFAULT 'managed'
    CHECK (default_account_mode IN ('byok', 'managed')),
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  device_id uuid,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_active_idx ON auth_sessions (token_hash) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('desktop', 'ios', 'android', 'web')),
  label text,
  installation_id_hash text,
  app_version text,
  os_version text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_devices_user_idx ON user_devices (user_id, last_seen_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS user_devices_installation_unique_idx
  ON user_devices (user_id, installation_id_hash)
  WHERE installation_id_hash IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auth_sessions_device_fk'
  ) THEN
    ALTER TABLE auth_sessions
      ADD CONSTRAINT auth_sessions_device_fk
      FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('groq')),
  encrypted_secret text NOT NULL,
  encryption_iv text NOT NULL,
  encryption_tag text NOT NULL,
  encryption_key_id text NOT NULL,
  encryption_version integer NOT NULL DEFAULT 1,
  secret_last4 text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_active_provider_idx
  ON user_credentials (user_id, provider) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_credentials_user_idx ON user_credentials (user_id, provider, updated_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'auto',
  prompt_style text NOT NULL DEFAULT 'Clean',
  custom_prompt text NOT NULL DEFAULT '',
  enhance_text boolean NOT NULL DEFAULT true,
  model text NOT NULL DEFAULT 'whisper-large-v3-turbo',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS managed_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'suspended', 'canceled')),
  source text NOT NULL CHECK (source IN ('default_free', 'admin', 'trial', 'promo', 'paystack')),
  plan_code text,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz,
  monthly_audio_seconds integer NOT NULL DEFAULT 0,
  monthly_request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS managed_allocations_user_active_idx ON managed_allocations (user_id, status, period_end DESC);

CREATE TABLE IF NOT EXISTS managed_usage_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES managed_allocations(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  audio_seconds_used numeric(12, 3) NOT NULL DEFAULT 0,
  request_count_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (allocation_id, period_key)
);
CREATE INDEX IF NOT EXISTS managed_usage_periods_user_idx ON managed_usage_periods (user_id, period_key DESC);

CREATE TABLE IF NOT EXISTS transcript_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES user_devices(id) ON DELETE SET NULL,
  request_id uuid NOT NULL,
  client_session_id text,
  mode text NOT NULL CHECK (mode IN ('byok', 'managed')),
  provider text NOT NULL DEFAULT 'groq',
  model text,
  raw_text text NOT NULL,
  refined_text text,
  audio_seconds numeric(10, 3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS transcript_history_request_unique_idx ON transcript_history (user_id, request_id);
CREATE INDEX IF NOT EXISTS transcript_history_user_created_idx ON transcript_history (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES user_devices(id) ON DELETE SET NULL,
  request_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('byok', 'managed')),
  provider text NOT NULL DEFAULT 'groq',
  action text NOT NULL CHECK (action IN ('process', 'transcription', 'refinement')),
  model text,
  audio_seconds numeric(10, 3) NOT NULL DEFAULT 0,
  input_chars integer NOT NULL DEFAULT 0,
  output_chars integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS usage_events_user_request_action_unique_idx ON usage_events (user_id, request_id, action);
CREATE INDEX IF NOT EXISTS usage_events_user_mode_created_idx ON usage_events (user_id, mode, created_at DESC);
