# Task 01: Diagnose Android Upgrade Failure Path

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

Takomi `vibe-build` stabilization. Investigate before changing code. If a code/config fix is clear, implement it and run focused verification.

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260607-224357/master_plan.md`
- `docs/mobile-android-updates.md`
- `docs/release-process.md`
- `docs/features/UnifiedDesktopMobileRelease_1.1.8.md`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/mobile/src/updates/android-updates.ts`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Repo-specific Expo Android update flow; no external overlay needed. |

## Objective

Explain and, if possible, fix why an installed Android v1.1.8 APK cannot upgrade cleanly to v1.1.9 and instead requires uninstall/reinstall.

## Scope

- Check package identity (`android.package`), version name/code, EAS remote version behavior, permissions, APK update manifest parsing, APK downloader/installer flow, and release docs.
- Inspect whether local fallback version code `18` conflicts with EAS reported Android build version/versionCode behavior from previous releases.
- Identify whether failure is likely code/config vs release artifact/signing pipeline.

## Context

User reported upgrade from “1.8 to 1.9” failed. Repo now shows `1.1.9` and Android fallback `versionCode` 18. Previous docs state v1.1.8 APK was EAS-reported Android build version `4`, suggesting EAS remote versioning may not match local fallback versionCode.

## Definition Of Done

- Root cause candidates are ranked with supporting file evidence.
- If a repo fix is available, it is implemented.
- If release/signing artifact validation is required, exact manual commands/checks are documented.
- No speculative destructive changes.

## Expected Artifacts

- Code/config diff if needed.
- Brief diagnosis summary with verification commands run.

## Constraints

- Do not bump versions or create releases unless explicitly requested.
- Do not assume Android can silent-install updates.
- Do not remove existing update permission UX.

## Verification

Run focused checks relevant to changed files, e.g. mobile type-check and Expo config resolution.
