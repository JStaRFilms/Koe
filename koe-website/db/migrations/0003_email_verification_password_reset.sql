CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_email_tokens_user_type_idx
  ON auth_email_tokens (user_id, type, expires_at DESC);

CREATE INDEX IF NOT EXISTS auth_email_tokens_unused_idx
  ON auth_email_tokens (token_hash, type)
  WHERE used_at IS NULL;
