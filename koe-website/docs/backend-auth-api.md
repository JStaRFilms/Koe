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

- `POST /api/v1/process` accepts multipart audio, `requestId`, optional `mode`, settings, and an optional `Accept: application/x-ndjson`. The server resolves BYOK/managed mode, decrypts BYOK only server-side, calls Groq, and records history/usage.
- `POST /api/v1/process/refine` accepts JSON `{ requestId, rawText, mode?, promptStyle?, customPrompt? }` and records refinement usage/history.

Managed mode requires a server-side allocation plus `GROQ_MANAGED_API_KEY`; clients cannot self-grant allocations or receive managed provider keys.
