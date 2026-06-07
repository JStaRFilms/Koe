# Task 03: Audit Desktop Parity and Legacy No-Session Behavior

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

Takomi `vibe-build` review/stabilization. Audit desktop and mobile account processing paths after Task 02 findings. Patch only if a clear contract mismatch is found.

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260607-224357/master_plan.md`
- `docs/features/AccountHistorySessionGrouping.md`
- `src/main/services/account-processing.js`
- `src/main/services/account-client.js`
- `src/main/services/transcription-session-manager.js`
- `apps/mobile/src/api/account-client.ts`
- `apps/mobile/src/providers/mobile-provider.ts`
- `apps/mobile/src/hooks/use-recording-pipeline.ts`
- Task 02 result/notes if available.

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Cross-surface repository audit. |

## Objective

Ensure desktop and mobile do not repeat the browser/history session regression, and document how legacy v1.8 rows without session IDs are handled.

## Scope

- Verify desktop sends `clientSessionId` consistently for chunked account processing.
- Verify mobile provider passes recording session ID through to account process requests.
- Compare naming between `sessionId`, `clientSessionId`, request IDs, and snapshot metadata.
- Identify whether backfilling/grouping legacy no-session rows by time proximity is warranted or too risky.

## Definition Of Done

- Desktop and mobile account-processing contract is explicitly confirmed or patched.
- Any residual legacy-history limitation is documented honestly.
- Focused checks pass for changed packages.

## Expected Artifacts

- Audit summary and code diffs if needed.
- Verification commands.

## Constraints

- Do not rewrite old account history data automatically without explicit product decision.
- Do not alter local desktop/mobile history behavior unless needed for account history parity.

## Dependencies

- Prefer Task 02 findings first, but this audit can start independently.
