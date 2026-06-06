# Task 05: Desktop Account / Account-Mode Integration

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-build`
- Role: code

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- Task 02 architecture result once available
- Task 04 backend result once available
- `src/main/services/groq.js`
- `src/main/services/settings.js`
- `src/main/ipc.js`
- `src/main/preload.js`
- `src/renderer/components/settings-panel.js`
- `src/renderer/settings-window.html`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Desktop integration task |

## Objective

Wire desktop to the shared account system so PC users can sign in, select BYOK or managed mode, and process through the authenticated backend when signed in.

## Scope

- Add desktop session persistence.
- Add IPC/preload methods for auth/account operations.
- Add settings UI for sign-up/sign-in/sign-out and account mode selection.
- Preserve local BYOK fallback for development/existing users.
- Route signed-in processing through the backend account processing endpoint.

## Context

Desktop currently stores `groqApiKey` locally in encrypted Electron Store and can use direct Groq or configured cloud proxy. Account mode should become the normal path without breaking local fallback.

## Definition Of Done

- Desktop can authenticate against backend API contracts.
- Signed-in account status is visible.
- User can choose BYOK or managed mode according to account state.
- Existing direct local BYOK path remains usable unless intentionally disabled.
- No secrets/tokens are logged.

## Expected Artifacts

- Desktop source changes.
- Short implementation result.

## Constraints

- Do not expose managed provider key to renderer or main process settings.
- Keep hotkey, auto-paste, and OS settings local-only.

## Dependencies

- Task 02.
- Task 04.

## Verification

- `pnpm build:core`
- Desktop build/type command available in repo.
- Manual smoke test notes for sign-in and processing flow.
