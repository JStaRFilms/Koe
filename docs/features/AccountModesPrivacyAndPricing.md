# Account Modes, Privacy, and Pricing Positioning

## Product positioning

Koe supports two processing paths:

1. **BYOK — Bring Your Own Key**
   - Free from Koe.
   - User supplies their own provider key.
   - Provider costs, limits, and provider policy are between the user and that provider.

2. **Managed processing**
   - No user API key required.
   - Koe uses a server-owned provider key that is never exposed to desktop or mobile clients.
   - Starts with a limited allowance when available.
   - Paid tiers can be added for regular/heavier use.

Do not describe Koe broadly as "free forever" or "no subscriptions" anymore. The accurate statement is:

> Koe is free with your own API key. Managed cloud processing is available for users who do not want to manage API keys, with free and paid tiers as the product matures.

## Browser experiences

Koe has two browser paths:

1. **Public demo**
   - Available from the marketing page.
   - Uses Koe-managed processing server-side.
   - Strictly limited by recording duration and per-IP quotas.
   - Does not store transcript history.

2. **Signed-in web app**
   - Available at `/app`.
   - Uses the same Koe account as desktop and mobile.
   - Managed mode uses the server-side managed key.
   - Account BYOK mode can use an already-saved encrypted BYOK credential without exposing the raw key to the browser.
   - The first signed-in web implementation should not include raw BYOK entry in the browser; users can add/update BYOK from desktop/mobile until web BYOK setup is explicitly approved.

## Mode behavior

- Signed in + `managed` mode uses Koe-managed server-side processing if the account has allocation and quota.
- Signed in + `byok` mode uses the encrypted account BYOK credential.
- Signed in + `byok` mode with no saved account key returns a clear error. It must not silently fall back to managed.
- Signed out uses local/device BYOK only if a local key is saved.
- Browser audio duration is derived server-side when possible. If browser `webm` metadata cannot be parsed, the signed-in web app can fall back to its own recorded duration estimate for managed quota billing instead of rejecting otherwise valid audio.

## Data handling

### Admin usage dashboard

- The admin usage dashboard exposes account emails, usage metadata, and transcript snippets.
- In production, `KOE_ADMIN_DASHBOARD_TOKEN` must be configured before the dashboard can render.
- If production dashboard access is enabled without a token, the route must stay unavailable rather than failing open.

### Signed out + local BYOK

- Transcript history stays on the device.
- Koe account database does not store signed-out transcript history.
- Audio is sent to the configured provider for processing.

### Signed in + managed or account BYOK

Koe stores account records needed for the product:

- user account and sessions
- devices and app metadata
- synced settings
- encrypted account BYOK metadata/secrets
- transcript text and refined text
- usage events and quota counters

Reason: account history, usage metering, support for retries/idempotency, quota enforcement, and future cross-device transcript sync.

### Audio

Koe should not intentionally store uploaded audio files. Audio is processed for the request and discarded by Koe after processing.

## Landing page copy guardrails

Use plain language:

- "Free with your own key."
- "No API key needed in managed mode."
- "Signed-in transcripts are stored with your account for history and future sync."
- "Signed-out local BYOK history stays on your device."
- "Audio is processed for the request and not stored by Koe."

Avoid:

- "No data collection"
- "Perfect privacy"
- "No subscriptions" as a broad claim
- "Unlimited" unless quota/billing actually supports it
- implying account BYOK or managed transcript text is not stored
