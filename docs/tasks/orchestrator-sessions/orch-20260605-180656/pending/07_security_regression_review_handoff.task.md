# Task 07: Cross-Device Verification, Security Review, and Handoff Docs

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-build`
- Role: review

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- Results from Tasks 02 through 06
- Changed files from git diff

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Review and handoff task |

## Objective

Review the auth/account-mode implementation for security, regressions, cross-device consistency, and release readiness.

## Scope

- Inspect changed backend, desktop, mobile, shared-core, and docs files.
- Verify no raw API keys, passwords, managed keys, or session tokens are logged or returned to clients.
- Verify server-side account mode resolution and usage metering safeguards.
- Run available build/type-check commands.
- Produce handoff notes and residual risks.

## Context

The feature touches sensitive auth, secrets, and provider cost allocation. Final review must be stricter than a normal UI feature review.

## Definition Of Done

- Review result lists pass/fail status for security and regression criteria.
- Verification commands and outputs are recorded.
- Residual risks and required follow-up tasks are documented.
- Orchestrator summary is ready for user handoff.

## Expected Artifacts

- Review result.
- Optional `Orchestrator_Summary.md` update.

## Constraints

- Treat missing password hashing, weak sessions, exposed provider keys, or unmetered managed mode as blockers.
- Treat mobile purchase/billing UI as a policy risk unless explicitly approved.

## Dependencies

- Tasks 03, 04, 05, and 06.

## Verification

- `pnpm --filter @koe/core build`
- `pnpm --filter koe-mobile type-check`
- `pnpm --filter website type-check` if website/backend is used
- Any repo-level build/test commands affected by implementation.
