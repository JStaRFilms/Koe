# Task 06: Mobile Account / Account-Mode Integration

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-build`
- Role: code

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- Task 02 architecture result once available
- Task 04 backend result once available
- `apps/mobile/app/onboarding.tsx`
- `apps/mobile/app/settings.tsx`
- `apps/mobile/src/providers/mobile-provider.ts`
- `apps/mobile/src/hooks/use-recording-pipeline.ts`
- `apps/mobile/src/storage/secure-storage.ts`
- `apps/mobile/src/storage/settings-storage.ts`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Mobile integration task |

## Objective

Wire mobile to the shared account system so users can sign in with the same account as desktop, select BYOK or app-managed mode, and process without needing a local API key when managed mode is allowed.

## Scope

- Add mobile session storage.
- Add account API client.
- Update onboarding/settings copy and UI for sign-in + account mode selection.
- Add BYOK save/delete via backend when signed in.
- Route signed-in processing through backend account processing endpoint.
- Preserve local BYOK fallback only if product/architecture approves it.

## Context

Mobile currently requires a local Groq API key before recording. The user explicitly wants users not to stress about bringing keys, so managed mode must be represented as a normal signed-in usage option.

## Definition Of Done

- Mobile sign-in/sign-up flows are present.
- Mobile can display account state and active mode.
- Mobile recording no longer fails solely because there is no local API key if account-managed mode is active.
- No tokens or API keys are logged.
- Existing recording retry state remains local and resilient.

## Expected Artifacts

- Mobile source changes.
- Short implementation result.

## Constraints

- Do not show purchase/subscription UI inside mobile in this task.
- Do not expose managed provider key client-side.

## Dependencies

- Task 02.
- Task 04.

## Verification

- `pnpm --filter @koe/core build`
- `pnpm --filter koe-mobile type-check`
- Expo export/smoke test if feasible.
