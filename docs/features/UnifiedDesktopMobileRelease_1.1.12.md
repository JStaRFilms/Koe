# Unified Desktop and Mobile Release 1.1.12

## Goal

Ship Koe `1.1.12` as a patch release for audio upload/import output controls and Android file-picker reliability.

Target release:

- Desktop package version: `1.1.12`
- Mobile package version: `1.1.12`
- Expo app version: `1.1.12`
- Android fallback version code: `21`
- GitHub release tag: `v1.1.12`

This release follows `docs/release-process.md`. Desktop artifacts are produced by GitHub Actions from the tag. Android APK artifacts should be produced by EAS from the pushed commit and attached to the matching GitHub Release.

## Release Notes

### Upload refinement controls

Audio upload/import now makes raw vs refined output explicit:

- **Web app:** upload panel has a `Refine after transcription` toggle before processing.
- **Web app:** raw transcript and refined transcript are displayed separately with separate copy actions.
- **Desktop:** audio upload section has a `Refine after transcription` toggle before processing.
- **Desktop:** raw and refined upload transcripts are displayed separately with separate copy actions.
- **Mobile:** import flow has a `Refine after import` toggle before choosing/processsing an audio file.
- **Mobile:** when refinement is enabled, the result screen shows both raw and refined text.

### Android import reliability fix

Fixed Android document-picker imports for `content://...` URIs. The v1.1.11 mobile import path attempted to call `FileSystemFile.copy()` directly on Android content URIs, which can fail with:

```text
Call to function 'FileSystemFile.copy' has been rejected.
This method cannot be used with content URIs
```

v1.1.12 now reads the picker-returned file bytes and writes them into Koe's app-local import cache before processing, preserving retry safety without relying on direct `content://` copy support.

## Routing / Security Notes

- Local/BYOK desktop and mobile processing still goes directly to Groq for speed.
- Signed-in managed/account processing remains proxied through Koe.
- Managed provider keys are not exposed to browser, desktop renderer, or mobile clients.
- Managed quota gating from v1.1.11 remains server-side and fail-closed when server-derived duration is unavailable.

## Regression Checks

- Root `package.json` version equals `1.1.12`.
- `apps/mobile/package.json` version equals `1.1.12`.
- `apps/mobile/app.json` `expo.version` equals `1.1.12`.
- `apps/mobile/app.json` `expo.android.versionCode` is greater than the previous fallback value.
- Desktop release tag is exactly `v1.1.12`.
- Upload/import entry points expose a refinement toggle before processing.
- Raw and refined output are visible separately on web/desktop, and visible in mobile completion details when refinement is enabled.
- Android content URI imports no longer call `FileSystemFile.copy()` directly.

## Verification Results

- `pnpm type-check`: passed.
- `pnpm --filter koe-mobile exec expo config --type public`: passed and resolved Expo `version` `1.1.12` with Android `versionCode` `21`.
- Desktop/service syntax checks: passed for main/preload/service/shared CommonJS files.
- `pnpm build:core`: passed.
- `pnpm exec vite build`: passed.
- `pnpm --dir koe-website lint`: passed.
- `pnpm --dir koe-website build`: passed.
- `pnpm --dir apps/mobile lint`: blocked because the mobile workspace does not currently provide an `eslint` executable.

## Manual QA Recommended

- On Android, import an `.m4a` selected from the system document picker and confirm the previous `content://` copy error is gone.
- Test mobile import with refinement on and off.
- Test web upload with refinement on and off.
- Test desktop upload with refinement on and off.
- Confirm raw and refined copy buttons copy the expected text.

## Approval Gate

Approved by the user request to fix upload refinement output and rebuild/deploy after the v1.1.11 mobile import issue report.
