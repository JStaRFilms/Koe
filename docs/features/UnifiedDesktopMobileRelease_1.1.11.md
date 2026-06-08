# Unified Desktop and Mobile Release 1.1.11

## Goal

Ship Koe `1.1.11` across desktop, mobile, and web with first-class audio-file upload/import support.

Target release:

- Desktop package version: `1.1.11`
- Mobile package version: `1.1.11`
- Expo app version: `1.1.11`
- Android fallback version code: `20`
- GitHub release tag: `v1.1.11`

This release follows `docs/release-process.md`. Desktop artifacts are produced by GitHub Actions from the tag. Android APK artifacts should be produced by EAS from the pushed commit and attached to the matching GitHub Release.

## Release Notes

### New: Audio files everywhere

Koe can now process existing audio files, not just live recordings:

- **Web app:** signed-in users get a dedicated Upload tab in `/app`.
- **Desktop:** the settings window now includes an Audio File Upload section with transcript copy support.
- **Mobile:** the recorder screen now supports importing an audio file through the native file picker.

### Routing stays safe and fast

- Local/BYOK desktop and mobile processing still goes directly to Groq for the fastest path.
- Signed-in managed/account processing remains proxied through the Koe backend.
- Managed provider keys are never exposed to browser, desktop renderer, or mobile clients.

### Quota and storage hardening

- Managed uploads now require server-derived audio duration before transcription, so quota checks fail closed when duration cannot be trusted.
- Uploads are capped at 20 MB on client entry points and validated server/IPC-side where applicable.
- Mobile imported audio is copied into app-local storage for retry safety, then cleaned up after success, empty result, or discard.
- Desktop multipart upload metadata is sanitized before forwarding to account processing.

## Implementation Summary

- Added web upload UI and wired it to the existing `/api/v1/process` route.
- Added desktop upload IPC and settings-window UI while reusing the existing `processAudio()` pipeline.
- Added mobile import support using Expo FileSystem's file picker and the existing retry/provider pipeline.
- Tightened managed quota enforcement in `koe-website/app/api/v1/process/route.ts`.

## Regression Checks

- Root `package.json` version equals `1.1.11`.
- `apps/mobile/package.json` version equals `1.1.11`.
- `apps/mobile/app.json` `expo.version` equals `1.1.11`.
- `apps/mobile/app.json` `expo.android.versionCode` is greater than the previous fallback value.
- Desktop release tag is exactly `v1.1.11`.
- Managed upload processing remains server-proxied and quota-gated.
- Local/BYOK native processing remains direct-to-provider.

## Verification Results

- `pnpm type-check`: passed.
- `pnpm --filter koe-mobile exec expo config --type public`: passed and resolved Expo `version` `1.1.11` with Android `versionCode` `20`.
- Desktop/service syntax checks: passed for main/preload/service/shared files.
- `pnpm build:core`: passed.
- `pnpm exec vite build`: passed.
- `pnpm --dir koe-website lint`: passed.
- `pnpm --dir koe-website build`: passed.
- `pnpm --dir apps/mobile lint`: blocked because the mobile workspace does not currently provide an `eslint` executable.

## Manual QA Recommended

- Upload a short `.wav`/`.mp3` in signed-in web managed mode and confirm history/usage updates.
- Upload a desktop audio file in signed-in managed mode and signed-out BYOK mode.
- Import a mobile audio file on Android/iOS in signed-in account mode and signed-out BYOK mode.
- Confirm managed over-quota uploads are rejected before provider transcription.
- Confirm mobile imported files retry after a simulated failure and disappear after discard/success.

## Approval Gate

Approved by the user request to push these upload features and make a new release.
