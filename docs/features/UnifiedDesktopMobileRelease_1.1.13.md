# Unified Desktop and Mobile Release 1.1.13

## Goal

Ship Koe `1.1.13` as a patch release for mobile multipart account uploads and a more native desktop import flow.

Target release:

- Desktop package version: `1.1.13`
- Mobile package version: `1.1.13`
- Expo app version: `1.1.13`
- Android fallback version code: `22`
- GitHub release tag: `v1.1.13`

This release follows `docs/release-process.md`. Desktop artifacts are produced by GitHub Actions from the tag. Android APK artifacts should be produced by EAS from the pushed commit and attached to the matching GitHub Release.

## Release Notes

### Mobile account uploads now use multipart

Mobile signed-in processing no longer sends audio as base64 JSON. It now uses multipart form upload to `/api/v1/process`, matching the browser/backend upload shape and avoiding unnecessary base64 size inflation.

This directly addresses mobile import failures like:

```text
Processing failed
Request Entity Too Large
```

Local signed-out BYOK mobile transcription still goes directly to Groq.

### Desktop import is part of the transcription family

Desktop now has an `Import Audio File...` tray action alongside recording. It opens the native file picker, uses the pill/status pipeline, copies the transcript to clipboard, and saves the result to local history. This makes desktop upload/import feel like a transcription action instead of only a settings utility.

The Settings window upload section remains available for explicit raw/refined review and copy controls.

### Sync behavior

Signed-in mobile and desktop uploads/imports use Koe account processing and are written to account history, so they appear in browser `/app` history after refresh. Signed-out/local BYOK remains intentionally local and does not sync.

## Routing / Security Notes

- Mobile signed-in multipart uploads still go to Koe backend first.
- Managed provider keys are not exposed to mobile, desktop renderer, or browser clients.
- Desktop/mobile local BYOK direct-to-Groq paths are unchanged.
- Managed quota gating remains server-side.

## Verification Results

- `pnpm type-check`: passed.
- `pnpm --filter koe-mobile exec expo config --type public`: passed and resolved Expo `version` `1.1.13` with Android `versionCode` `22`.
- Desktop/service syntax checks: passed for CommonJS main/preload/service/shared files.
- `pnpm build:core`: passed.
- `pnpm exec vite build`: passed.
- `pnpm --dir koe-website lint`: passed.
- `pnpm --dir koe-website build`: passed.

## Manual QA Recommended

- Mobile signed-in import of a larger `.m4a`/`.mp3` that previously hit `Request Entity Too Large`.
- Mobile signed-in import with refinement on/off, then browser `/app` history refresh.
- Desktop tray `Import Audio File...` in signed-in mode and signed-out local BYOK mode.
- Desktop Settings upload with raw/refined toggle.
- Browser history refresh after desktop/mobile signed-in imports.

## Approval Gate

Approved by the user request to switch mobile account uploads to multipart and make desktop import feel like part of the main transcription flow.
