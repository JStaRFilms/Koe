# Desktop + Expo Auth Recovery and Email Verification

## Goal

Add first-class forgot-password and confirm-email entry points to the Electron desktop app and the Expo mobile app, using the existing website auth API endpoints.

The native apps should make it obvious how to recover an account, whether the current email is verified, and how to resend a verification email. The web reset and verification links remain the canonical completion pages.

## Current State

- The website already exposes:
  - `POST /api/v1/auth/request-password-reset`
  - `POST /api/v1/auth/request-email-verification`
  - `/reset-password`
  - `/verify-email`
- The Electron app has account sign-up, sign-in, sign-out, mode, and BYOK IPC flows.
- The Expo app has sign-up, sign-in, sign-out, account mode, BYOK, and snapshot refresh flows.
- Neither native client currently has UI or client-service functions for password reset or email verification requests.

## Components

### Shared Backend Contract

No new database schema is required.

The native clients will call the existing endpoints:

- `POST /auth/request-password-reset`
  - unauthenticated
  - body: `{ "email": string }`
  - success response is intentionally generic
- `POST /auth/request-email-verification`
  - authenticated
  - uses the stored account session token
  - sends a verification email for the current signed-in user

Account snapshots should preserve the returned `emailVerifiedAt` value when available so the clients can show verified/unverified state.

### Electron Desktop Client

Files likely involved:

- `src/shared/constants.js`
- `src/main/preload.js`
- `src/main/ipc.js`
- `src/main/services/account-client.js`
- `src/renderer/components/settings-panel.js`
- desktop settings markup/styles if the account controls live outside the component module

Planned changes:

- Add account IPC channel constants for password-reset and email-verification requests.
- Add preload APIs:
  - `requestAccountPasswordReset(email)`
  - `requestAccountEmailVerification()`
- Add main-process IPC handlers that call the account client.
- Add account-client methods that post to the backend endpoints.
- Add a forgot-password action near the desktop sign-in form.
- Add a signed-in email verification indicator.
- Add a resend-verification button for unverified accounts.
- Optionally request a verification email automatically after sign-up, while still keeping a manual resend action.
- Add clear pending, success, and error feedback for each action.

### Expo Mobile Client

Files likely involved:

- `apps/mobile/src/api/account-client.ts`
- `apps/mobile/src/account/account-service.ts`
- `apps/mobile/src/components/AccountAuthCard.tsx`
- signed-in account/settings screen components that render the current account snapshot
- account/session types or storage helpers if `emailVerifiedAt` is not already preserved

Planned changes:

- Add API-client methods:
  - `requestPasswordReset(email)`
  - `requestEmailVerification(session)`
- Add account-service wrappers:
  - `requestAccountPasswordReset(email)`
  - `requestStoredEmailVerification()`
- Extend the mobile auth card with a reset mode:
  - email-only input
  - send-reset action
  - return-to-sign-in action
  - success/error feedback and mobile-friendly tap states
- Add signed-in email verification status and resend control.
- Preserve `emailVerifiedAt` from account snapshots and authentication responses.
- Use existing haptics/status conventions for success and failure feedback.

## Data Flow

### Forgot Password

1. User taps forgot-password in Electron or Expo.
2. Client asks for or reuses an email address.
3. Client sends `POST /auth/request-password-reset`.
4. Backend sends a reset email when the account exists.
5. Client shows generic success copy so account existence is not leaked.
6. User completes the reset on the web reset page from the email link.

### Confirm Email

1. Signed-in user sees verification state in the account area.
2. If unverified, user taps resend verification.
3. Client sends `POST /auth/request-email-verification` with the stored session.
4. Backend sends verification email.
5. Client shows sent feedback.
6. User completes verification on the web verify page from the email link.
7. Future account refreshes should show `emailVerifiedAt` once the backend reports it.

## Database Schema

No schema changes.

The existing user email verification fields and token tables remain the source of truth.

## UX Requirements

- Desktop and mobile must both expose the recovery action before sign-in.
- Desktop and mobile must both expose verification state after sign-in.
- Buttons must show a visible pending state and a completed/error result.
- Mobile tap targets should remain comfortable and not depend on hover.
- Success text for password reset must stay generic.
- Verification resend should be disabled while the request is pending.

## Verification Plan

- Run the relevant desktop and mobile type/build checks after implementation.
- Exercise Electron account UI manually where possible.
- Exercise Expo mobile UI paths for:
  - sign-in form
  - reset-password request mode
  - signed-in verification status
  - resend verification action
- Confirm the API requests hit the same backend contract used by the website.
- Run `pnpm convex deploy` at handoff if this workspace has Convex configuration active for the touched project.

## Implementation Notes

### Completed

- Electron now exposes account password-reset and email-verification request IPC channels.
- Electron preload now exposes:
  - `requestAccountPasswordReset({ email })`
  - `requestAccountEmailVerification()`
- Electron account client now calls the existing backend auth email endpoints.
- Electron settings account actions now include:
  - `Forgot Password` while signed out
  - `Verify Email` while signed in and unverified
  - `Email Verified` disabled state once `emailVerifiedAt` exists
- Electron account snapshot now shows email verification status.
- Expo account API client now calls the existing backend auth email endpoints.
- Expo secure account session types preserve `emailVerifiedAt`.
- Expo account service now exposes:
  - `requestAccountPasswordReset(email)`
  - `requestStoredEmailVerification()`
- Expo auth card now has a reset mode with email-only input and generic success feedback.
- Expo settings account snapshot now shows email verification status and a resend-verification button for unverified accounts.
- Expo auth card styles were extracted to keep the component under the 200-line project guideline.

### Product Decisions

- Password reset remains email-link based and completes in the browser.
- Email verification remains email-link based and completes in the browser.
- Native clients provide explicit manual resend controls instead of silently sending duplicate verification emails after every sign-up.

### Verification Status

- `pnpm --filter koe-mobile type-check` passes after each Expo TypeScript edit.
- `pnpm type-check` passes across the workspace.
- `pnpm build:core` passes.
- `pnpm exec vite build` passes for the Electron renderer/settings bundle.
- Desktop changed JavaScript files pass `node --check`.
- `pnpm --filter koe-mobile lint` is blocked because the `eslint` executable is not installed/available to the mobile package script in this workspace.

## Open Questions

- Should native clients deep-link back from the web verification/reset pages later, or is completing those flows in the browser enough for this pass?
