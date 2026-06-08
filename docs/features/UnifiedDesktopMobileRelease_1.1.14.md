# Unified Desktop and Mobile Release 1.1.14

## Purpose

`v1.1.14` supersedes the cancelled/incomplete `v1.1.13` build artifacts and restores the audio import release with the desktop tray import fixes and a safer desktop Import tab implementation.

## Version Targets

- Desktop app: `1.1.14`
- Mobile app: `1.1.14`
- Android versionCode: `23`
- GitHub tag: `v1.1.14`

## Included Fixes

### Mobile signed-in import/upload

- Signed-in mobile account audio uploads use multipart form data instead of base64 JSON.
- This avoids base64 inflation causing `Request Entity Too Large` for valid files below the server cap.
- Android `content://` imports are persisted by reading bytes and writing them to app storage, avoiding `FileSystemFile.copy` content URI failures.

### Desktop Import tab

- Desktop has a top-level `Import` tab beside Settings.
- The Import tab uses the existing upload processing pipeline without changing the global settings window/nav layout.
- Upload controls include raw/refined transcript output and refinement control.

### Desktop tray import

- Tray `Import Audio File...` uses UUID request IDs so signed-in backend processing accepts the request.
- Tray import now follows normal output behavior: copy transcript, then auto-paste when `autoPaste` is enabled.
- Tray also includes `Open Import Tab...` for users who want the full import UI.

### Sync and privacy behavior

- Signed-in managed/account processing remains proxied through Koe backend.
- Managed provider keys are not exposed to clients.
- Local/BYOK native paths remain direct-to-Groq.
- Signed-in imports should sync to browser `/app` history after refresh.

## Limits

- Audio import/upload cap remains 20 MB.

## Verification Checklist

- `node --check src/main/tray.js`
- `node --check src/main/settings-window.js`
- `node --check src/main/preload.js`
- `node --check src/shared/constants.js`
- `node --input-type=module --check < src/renderer/settings-window.js`
- `pnpm type-check`
- `pnpm exec vite build`
- `pnpm --filter koe-mobile exec expo config --type public`

## Manual QA

- Settings tab still opens normally and its sidebar sections work.
- Top tabs are `Settings | Import | History | Usage`.
- Import tab shows upload controls and does not overlap the nav bar.
- History and Usage tabs still render correctly.
- Desktop tray quick import works when signed in and does not return `Invalid processing request`.
- Desktop tray quick import auto-pastes only when auto-paste is enabled.
- Mobile signed-in import of a 10-18 MB audio file succeeds and appears in browser `/app` history after refresh.
