# Task 02 Architecture Report: Neon Auth + Account Modes

Session: `orch-20260605-180656`  
Date: 2026-06-05

## Inputs Reviewed

- `master_plan.md` is malformed/self-referential and contains only its own path, so this report uses the task packets, orchestrator JSON, completed intake, feature docs, and repo code as source of truth.
- Task packet: `pending/02_neon_auth_account_mode_architecture.task.md`
- Feature docs: `docs/features/CentralizedAuthBilling.md`, `docs/features/Phase1_AuthSyncedBYOK.md`
- Packages/config: root `package.json`, `koe-website/package.json`, `apps/mobile/package.json`, `packages/koe-core/src/constants.ts`, `.env.example`
- Current call sites: desktop `groq.js`, `transcription-worker.js`, `transcription-session-manager.js`, `settings.js`, IPC/preload/settings panel; mobile `mobile-provider.ts`, `use-recording-pipeline.ts`, SecureStore/settings/history, onboarding/settings; website `app/api/process/route.ts`, `app/api/transcribe/route.ts`.

## Key Decision

Host the account/backend API in the existing Next app under `koe-website/`. Desktop already points at the website processing host, the app already has Node API routes, and this avoids adding a second service. Desktop/mobile must call HTTPS API routes, never Neon directly.

Recommended backend files:

```text
koe-website/app/api/v1/auth/**
koe-website/app/api/v1/account/**
koe-website/app/api/v1/devices/**
koe-website/app/api/v1/process/**
koe-website/lib/server/db.ts
koe-website/lib/server/auth.ts
koe-website/lib/server/crypto.ts
koe-website/lib/server/account-mode.ts
koe-website/lib/server/provider/groq.ts
koe-website/db/migrations/*.sql
```

Recommended dependencies: `@neondatabase/serverless`, `zod`, and Argon2id hashing via `@node-rs/argon2` if deploy supports it. If native hashing blocks first slice, use `bcryptjs` cost 12+ temporarily and track Argon2id as hardening.

## Neon Schema

Enable:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
```

### Users

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_algo text NOT NULL DEFAULT 'argon2id',
  display_name text,
  default_account_mode text NOT NULL DEFAULT 'managed'
    CHECK (default_account_mode IN ('byok', 'managed')),
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_created_at_idx ON users (created_at DESC);
```

`managed` default matches the new product direction, but the resolver honors it only if a server-owned allocation exists.

### Sessions

```sql
CREATE TABLE auth_sessions (
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
CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id, expires_at DESC);
CREATE INDEX auth_sessions_active_idx ON auth_sessions (token_hash) WHERE revoked_at IS NULL;
```

Return raw opaque session tokens once. Store only `sha256(raw_token)`.

### Devices

```sql
CREATE TABLE user_devices (
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
CREATE INDEX user_devices_user_idx ON user_devices (user_id, last_seen_at DESC);
CREATE UNIQUE INDEX user_devices_installation_unique_idx
  ON user_devices (user_id, installation_id_hash)
  WHERE installation_id_hash IS NOT NULL;
```

### BYOK Credential Vault

```sql
CREATE TABLE user_credentials (
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
CREATE UNIQUE INDEX user_credentials_active_provider_idx
  ON user_credentials (user_id, provider) WHERE deleted_at IS NULL;
CREATE INDEX user_credentials_user_idx ON user_credentials (user_id, provider, updated_at DESC);
```

Clients never receive encrypted fields or decrypted secrets, only metadata.

### Synced Settings

```sql
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'auto',
  prompt_style text NOT NULL DEFAULT 'Clean',
  custom_prompt text NOT NULL DEFAULT '',
  enhance_text boolean NOT NULL DEFAULT true,
  model text NOT NULL DEFAULT 'whisper-large-v3-turbo',
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Sync only cross-device preferences. Keep desktop hotkey, OS permissions, auto-paste, launch/update settings, window position, and retry blobs local-only.

### History and Usage

```sql
CREATE TABLE transcript_history (
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
CREATE UNIQUE INDEX transcript_history_request_unique_idx ON transcript_history (user_id, request_id);
CREATE INDEX transcript_history_user_created_idx ON transcript_history (user_id, created_at DESC);

CREATE TABLE usage_events (
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
CREATE UNIQUE INDEX usage_events_user_request_action_unique_idx ON usage_events (user_id, request_id, action);
CREATE INDEX usage_events_user_mode_created_idx ON usage_events (user_id, mode, created_at DESC);
```

### Managed Allocations

```sql
CREATE TABLE managed_allocations (
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
CREATE INDEX managed_allocations_user_active_idx ON managed_allocations (user_id, status, period_end DESC);

CREATE TABLE managed_usage_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NO

## API Route Contracts

All account routes are under `koe-website/app/api/v1/**`, runtime `nodejs`. JSON errors use:

```ts
type ApiError = { error: { code: string; message: string; retryable?: boolean } };
```

Authentication:

```http
Authorization: Bearer <opaque_session_token>
X-Koe-Device-Id: <uuid>        # optional but expected after registration
X-Koe-Client: desktop|ios|android|web
X-Koe-App-Version: <version>
```

### Auth

`POST /api/v1/auth/signup`

```json
{
  "email": "user@example.com",
  "password": "minimum-12-chars",
  "displayName": "Optional Name",
  "platform": "desktop",
  "installationId": "client-generated-stable-id",
  "deviceLabel": "Work PC"
}
```

`201`:

```json
{
  "user": { "id": "uuid", "email": "user@example.com", "displayName": "Optional Name", "defaultMode": "managed" },
  "session": { "token": "kses_...", "expiresAt": "2026-07-05T00:00:00.000Z" },
  "device": { "id": "uuid", "platform": "desktop" }
}
```

`POST /api/v1/auth/signin`: same request minus `displayName`, same response.  
`POST /api/v1/auth/signout`: bearer token required, revokes current session, `204`.  
`GET /api/v1/auth/session`:

```json
{
  "authenticated": true,
  "user": { "id": "uuid", "email": "user@example.com", "displayName": null },
  "session": { "expiresAt": "2026-07-05T00:00:00.000Z" },
  "device": { "id": "uuid", "platform": "ios" }
}
```

### Devices

`POST /api/v1/devices/register`

```json
{ "platform": "desktop", "installationId": "stable-id", "label": "Work PC", "appVersion": "1.1.5", "osVersion": "Windows 11" }
```

Response:

```json
{ "device": { "id": "uuid", "platform": "desktop", "label": "Work PC" } }
```

### Account Snapshot

`GET /api/v1/account/snapshot`

```json
{
  "user": { "id": "uuid", "email": "user@example.com", "displayName": null, "defaultMode": "managed" },
  "resolvedMode": { "mode": "managed", "available": true, "reason": "managed_allocation_active" },
  "capabilities": {
    "byok": { "available": true, "provider": "groq", "last4": "abcd", "updatedAt": "2026-06-05T00:00:00.000Z" },
    "managed": {
      "available": true,
      "status": "active",
      "source": "default_free",
      "planCode": "free_monthly",
      "periodEndsAt": "2026-07-01T00:00:00.000Z",
      "usage": { "audioSecondsUsed": 240, "audioSecondsLimit": 3600, "requestCountUsed": 12, "requestCountLimit": 500 }
    }
  },
  "settings": { "language": "auto", "promptStyle": "Clean", "customPrompt": "", "enhanceText": true, "model": "whisper-large-v3-turbo" },
  "recentHistory": [],
  "policy": { "mobilePurchaseUiEnabled": false }
}
```

### Settings

`PATCH /api/v1/account/settings`

```json
{ "language": "auto", "promptStyle": "Clean", "customPrompt": "", "enhanceText": true, "model": "whisper-large-v3-turbo" }
```

Server must allowlist prompt styles and model IDs.

### BYOK Vault

`PUT /api/v1/account/credentials/groq`

```json
{ "apiKey": "gsk_...", "validate": true }
```

Response:

```json
{ "credential": { "provider": "groq", "available": true, "last4": "abcd", "updatedAt": "2026-06-05T00:00:00.000Z" } }
```

Server validates session, optionally validates the key against Groq models, encrypts before storage, and returns metadata only.

`DELETE /api/v1/account/credentials/groq`: soft delete, `204`.

### Account Mode

`PATCH /api/v1/account/mode`

```json
{ "defaultMode": "byok" }
```

Success:

```json
{ "defaultMode": "byok", "resolvedMode": { "mode": "byok", "available": true, "reason": "byok_credential_present" } }
```

Unavailable mode returns `409 MODE_UNAVAILABLE` or `409 MISSING_BYOK_CREDENTIAL`.

### Usage

`GET /api/v1/account/usage?period=current`

```json
{
  "managed": { "audioSecondsUsed": 240, "audioSecondsLimit": 3600, "requestCountUsed": 12, "requestCountLimit": 500, "periodStart": "2026-06-01", "periodEnd": "2026-06-30" },
  "byok": { "audioSecondsUsed": 91, "requestCountUsed": 5 }
}
```

## Processing Contracts

Keep legacy `/api/process` during migration. Add authenticated routes:

### `POST /api/v1/process`

Purpose: transcribe one audio payload and optionally refine it. Desktop can call this per segment with `enhanceText=false`; mobile can use one-shot processing.

Request: `multipart/form-data`

```text
audio or file: Blob
requestId: uuid
clientSessionId: string optional
mode: byok|managed optional preference only
language: auto|en|es|...
model: whisper-large-v3-turbo|whisper-large-v3
enhanceText: true|false
promptStyle: Clean|Formal|Professional|Casual|Concise
customPrompt: string
audioSeconds: number client estimate, not trusted for production billing
```

Headers: bearer token, optional `Accept: application/json` or `Accept: application/x-ndjson`, optional `X-Koe-Device-Id`.

JSON success:

```json
{
  "requestId": "uuid",
  "historyId": "uuid-or-null",
  "mode": "managed",
  "rawText": "hello world",
  "refinedText": "Hello world.",
  "empty": false,
  "usage": { "audioSecondsUsedThisRequest": 4.2, "managedRemainingAudioSeconds": 3595.8 }
}
```

NDJSON success, compatible with current desktop proxy parser shape:

```jsonl
{"type":"status","stage":"transcribing","label":"Transcribing","progress":58}
{"type":"status","stage":"refining","label":"Refining","progress":86}
{"type":"complete","requestId":"uuid","historyId":"uuid","mode":"managed","rawText":"hello world","refinedText":"Hello world.","usage":{"audioSecondsUsedThisRequest":4.2}}
```

Typed errors: `401 INVALID_SESSION`, `409 MISSING_BYOK_CREDENTIAL`, `409 MODE_UNAVAILABLE`, `402 MANAGED_LIMIT_EXCEEDED`, `413 AUDIO_TOO_LARGE`, `429 RATE_LIMITED`.

### `POST /api/v1/process/refine`

Preserves desktop chunked pipeline after segment transcription.

```json
{
  "requestId": "uuid",
  "clientSessionId": "desktop-session-123",
  "mode": "byok",
  "rawText": "joined raw transcript",
  "promptStyle": "Clean",
  "customPrompt": "",
  "model": "openai/gpt-oss-120b"
}
```

Response:

```json
{ "requestId": "uuid", "mode": "byok", "refinedText": "Joined raw transcript.", "usage": { "inputChars": 21, "outputChars": 22 } }
```

## Account-Mode Resolver

The resolver is server-only. Clients may request a mode, but never decide entitlement or limits.

Inputs:

```ts
type ResolveModeInput = {
  userId: string;
  requestedMode?: 'byok' | 'managed';
  devicePlatform?: 'desktop' | 'ios' | 'android' | 'web';
  estimatedAudioSeconds?: number;
};
```

Output:

```ts
type ResolvedMode =
  | { mode: 'byok'; provider: 'groq'; credentialId: string; reason: 'byok_credential_present' }
  | { mode: 'managed'; provider: 'groq'; allocationId: string; reason: 'managed_allocation_active' };
```

Resolution rules:

1. Authenticate session and load user.
2. Load server facts: BYOK credential, active managed allocation, current managed usage/quota, provider key availability.
3. Candidate mode is `requestedMode ?? users.default_account_mode`.
4. Candidate `byok` requires an active credential or returns `409 MISSING_BYOK_CREDENTIAL`.
5. Candidate `managed` requires active allocation, `GROQ_MANAGED_API_KEY`, and remaining quota or returns `409 MODE_UNAVAILABLE` / `402 MANAGED_LIMIT_EXCEEDED`.
6. Do not silently fall back between modes during processing; fallback can surprise users by changing who pays. Return typed errors and let the client prompt the user to switch.
7. Snapshot can show all capabilities and suggested next action.

Managed on mobile is allowed only when server-granted. Mobile must not show purchase/subscription UI and must not send entitlement claims.

## Encryption and Secret Handling

### BYOK

First slice:

- User submits BYOK once over HTTPS to `PUT /api/v1/account/credentials/groq`.
- Server encrypts before Neon persistence.
- Use AES-256-GCM, random 96-bit IV, auth tag, and AAD such as `user_id:provider:version`.
- Env:
  - `KOE_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID=k1`
  - `KOE_CREDENTIAL_ENCRYPTION_KEYS={"k1":"base64-32-byte-key"}`
- Store only ciphertext, IV, tag, key ID, version, last4.

Production hardening: KMS/HSM or envelope encryption with per-credential DEK, key rotation job, and decrypt audit logs.

Do not derive BYOK encryption only from the user's password because server-side processing must work after token auth without re-asking for the password.

### Managed provider key

- Store only as server secret, e.g. `GROQ_MANAGED_API_KEY`.
- Never write to client storage, never return to clients, never include in logs.
- If multiple managed providers are needed later, add an encrypted server-only `provider_secrets` table and admin tooling.

### Session tokens

- Server stores token hashes only.
- Desktop stores token/device ID in encrypted Electron Store, main process only. Renderer uses IPC snapshots, not raw token getters.
- Mobile stores token/device ID in Expo SecureStore.
- Existing local desktop/mobile Groq keys remain legacy/dev fallback only until migration, not the account source of truth.

## Security Rules

Must-have in the first slice:

- Passwords hashed, never raw.
- Tokens, BYOK secrets, managed keys, authorization headers, and encrypted material are redacted from logs.
- All account mutations require bearer session.
- Mode resolution is server-authoritative.
- Clients cannot create managed allocations or set usage limits.
- Validate all JSON/forms with allowlists.
- Restrict model IDs and prompt styles.
- Enforce audio upload size limits.
- Per-user and per-IP rate limits; DB-backed preferred over in-memory for serverless.
- Idempotent `requestId` avoids double history/usage writes.
- Sanitize upstream Groq errors before returning them.

Production hardening before broad managed launch:

- Email verification and password reset.
- Login brute-force controls by email/IP.
- Persistent distributed rate limiter.
- Server-derived audio duration for quota enforcement instead of trusting `audioSeconds`.
- Abuse monitoring for managed mode.
- Admin allocation UI with audit logs.
- Session/device management.
- Data export/delete flows.
- Backups, migration rollback, and key rotation runbooks.

## Client Contracts

### Desktop

Current desktop stores `groqApiKey` locally and `transcription-worker.js` calls Groq directly. Target:

- Add main-process account API client.
- Add IPC/preload methods for signup, signin, signout, snapshot, save/delete BYOK, set mode, save synced settings.
- Store session token in encrypted main-process settings; do not expose a token getter to renderer.
- Signed-in processing uses `/api/v1/process` and `/api/v1/process/refine`.
- Keep local direct Groq path as signed-out legacy/dev fallback.
- Keep hotkey, auto-paste, launch/update, and OS settings local-only.

### Mobile

Current mobile uses SecureStore local Groq key and direct Groq requests. Target:

- Add account API client.
- Store bearer token/device ID in Expo SecureStore.
- Settings/onboarding show signin/signup and mode status.
- BYOK save/delete uses server vault when signed in.
- Recording calls `/api/v1/process` when signed in.
- If resolved mode is managed, recording must not require a local Groq key.
- No mobile purchase/subscription UI in this task.
- Retry audio remains local. History can be cached locally while server history becomes source of truth.

### Shared Core

Add client-safe shared types only: `AccountMode`, snapshot contracts, credential metadata, supported model/mode constants. Do not put server encryption or env helpers in `@koe/core`.

## Implementation Sequencing

### A. Safe backend scaffold

1. Add Neon connection and migrations.
2. Add schema tables.
3. Add auth helpers for password hash/verify and opaque hashed sessions.
4. Add signup/signin/signout/session.
5. Add device registration.
6. Add snapshot with empty/initial capabilities.

Acceptance: website type-check passes; account can be created/signed in/out; DB stores password/token hashes only.

### B. BYOK vault and synced settings

1. AES-GCM helper.
2. BYOK upsert/delete.
3. Optional Groq validation on upsert.
4. Settings patch.
5. Snapshot reports BYOK metadata only.

Acceptance: raw key never appears in DB/logs; deletion makes BYOK unavailable.

### C. Resolver and managed scaffold

1. Resolver helper.
2. Mode patch route.
3. Managed allocation and usage-period logic.
4. Gate managed on server allocation plus `GROQ_MANAGED_API_KEY`.
5. Optional dev/admin seed path outside public client APIs.

Acceptance: client cannot self-enable managed; unallocated managed requests fail typed; allocated users resolve server-side.

### D. Authenticated processing

1. `/api/v1/process` and `/api/v1/process/refine`.
2. Resolve BYOK decrypted key or managed env key server-side.
3. Support NDJSON for desktop and JSON for mobile.
4. Persist usage/history.
5. Enforce size/model/rate/idempotency.

Acceptance: BYOK processing works without client sending Groq key each request; managed works only for allocated users; managed key stays server-only.

### E. Desktop integration

Add account client, secure token storage, IPC/preload, settings UI, mode/BYOK controls, and signed-in processing. Preserve local fallback.

Acceptance: desktop can process in BYOK and allocated managed mode; renderer never receives managed key or decrypted BYOK.

### F. Mobile integration

Add API client, SecureStore token/device, auth UI, server BYOK vault, and account processing. Remove local-key requirement for managed mode.

Acceptance: same account works on desktop/mobile; mobile managed mode works without local Groq key; no billing UI.

### G. Review/hardening

Security review, smoke tests, docs/privacy updates, and production hardening backlog.

## First Safe Slice vs Production Hardening

First shippable slice:

- Neon migrations.
- Email/password signup/signin/signout.
- Opaque hashed sessions.
- Account snapshot.
- Server-encrypted BYOK vault.
- Server-side BYOK processing.
- Managed mode scaffold, disabled or server-allocated only.
- Usage/history writes.
- Desktop/mobile session storage and authenticated processing.

Do not include public billing UI, client entitlement flags, mobile purchase UI, broad admin console, or automatic client-controlled managed enablement.

Production hardening before charging/opening managed widely: email verification, reset flow, distributed rate limits, server-derived audio duration, KMS/envelope encryption, abuse/fraud monitoring, admin allocations with audits, session/device management, data export/delete, backups and migration rollback.

## Main Risks

1. Credential vault custody. Mitigate with AES-GCM now, KMS/envelope and audits later.
2. Managed cost exposure. Mitigate with allocations, quotas, rate limits, no client entitlements.
3. Desktop chunked pipeline mismatch. Mitigate with `/api/v1/process` `enhanceText=false` plus `/api/v1/process/refine`.
4. Mobile policy risk. Managed can be server-granted, but no mobile purchase UI in this task.
5. Malformed master plan. Builders should use this report plus task packets until repaired.

## Suggested Feature Doc Edits

Update `CentralizedAuthBilling.md` and `Phase1_AuthSyncedBYOK.md` to replace Convex with Neon/Next API, clarify mobile has managed capability when server-granted, keep mobile purchase UI out of scope, state managed is server-metered, and state BYOK is app-encrypted before Neon persistence.

## Builder Read-First List

1. This report.
2. `pending/04_backend_auth_neon_account_modes.task.md`
3. `koe-website/app/api/process/route.ts`
4. `src/main/services/transcription-worker.js`
5. `src/main/services/transcription-session-manager.js`
6. `apps/mobile/src/providers/mobile-provider.ts`
7. `apps/mobile/src/hooks/use-recording-pipeline.ts`
8. `.env.example`
