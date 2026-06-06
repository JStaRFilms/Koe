# Koe Backend Account API (first safe slice)

All routes run server-side in the Next app under `/api/v1`. Clients authenticate with:

```http
Authorization: Bearer <kses_opaque_session_token>
X-Koe-Device-Id: <uuid>        # optional for first slice
X-Koe-Client: desktop|ios|android|web
```

Errors use `{ "error": { "code": "...", "message": "...", "retryable": false } }`.

## Auth

- `POST /api/v1/auth/signup` with `{ email, password, displayName?, platform?, installationId?, deviceLabel? }` returns user, device metadata, and the raw session token. Passwords are bcrypt-hashed; only token hashes are stored.
- `POST /api/v1/auth/signin` with `{ email, password, platform?, installationId?, deviceLabel? }` returns the same shape.
- `POST /api/v1/auth/signout` revokes the current bearer session and returns `204`.
- `GET /api/v1/auth/session` returns authenticated user/session/device metadata without the raw token.

## Devices and account

- `POST /api/v1/devices/register` registers/touches a device for the current account.
- `GET /api/v1/account/snapshot` returns user, resolved mode, BYOK/managed capabilities, synced settings, recent history, and `mobilePurchaseUiEnabled: false`.
- `PATCH /api/v1/account/settings` updates allowlisted synced settings.
- `PATCH /api/v1/account/mode` sets `byok` or `managed` only if the server-authoritative resolver says the mode is available.
- `GET /api/v1/account/usage` returns current managed and BYOK usage scaffold.

## BYOK vault

- `PUT /api/v1/account/credentials/groq` with `{ apiKey, validate? }` encrypts the key using AES-256-GCM before Neon persistence and returns metadata only (`provider`, `last4`, `updatedAt`).
- `DELETE /api/v1/account/credentials/groq` soft-deletes the active credential and returns `204`.

## Processing scaffold

- `POST /api/v1/public-demo/process` accepts short multipart audio from the landing-page public demo. It uses `GROQ_MANAGED_API_KEY` server-side, enforces per-IP rate limits and a short duration cap, and does not store transcript history.
- `POST /api/v1/process` accepts multipart audio or JSON/base64 audio, `requestId`, optional `mode`, settings, `audioSeconds`, and an optional `Accept: application/x-ndjson`. JSON/base64 uploads are rejected before decoding when their encoded payload would exceed the 20 MB audio cap. The server resolves BYOK/managed mode, decrypts BYOK only server-side, calls Groq, and records history/usage. For browser media blobs where server duration parsing is unavailable, the route can use the client-recorded `audioSeconds` estimate for managed quota billing.
- `POST /api/v1/process/refine` accepts JSON `{ requestId, rawText, mode?, promptStyle?, customPrompt? }` and records refinement usage/history.

## Admin usage dashboard

- `/admin/usage` is disabled by default in production unless `KOE_ADMIN_DASHBOARD_ENABLED=true`.
- Production dashboard rendering also requires `KOE_ADMIN_DASHBOARD_TOKEN`; without it, the route returns not found instead of showing account data.
- When a token is configured, callers must pass it with `?token=...`.

Managed mode requires a server-side allocation plus `GROQ_MANAGED_API_KEY`; clients cannot self-grant allocations or receive managed provider keys.

## Data handling policy

- Signed-out/local BYOK processing stores transcript history locally in the client app, not in the Koe account database.
- Signed-in processing, whether managed or account BYOK, stores transcript text, refined transcript text, usage metadata, device metadata, and account settings in Neon for account history, quota tracking, retries/idempotency, and future cross-device sync.
- Koe should not intentionally persist uploaded audio files. Audio is processed for the request and discarded after processing.
- BYOK mode without an account BYOK credential must return `MISSING_BYOK_CREDENTIAL`; it must not silently fall back to managed mode.
