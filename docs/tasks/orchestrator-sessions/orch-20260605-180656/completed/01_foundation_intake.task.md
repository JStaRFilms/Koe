# Task 01: Foundation Intake and Session Setup

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-genesis`
- Role: orchestrator

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- `docs/features/CentralizedAuthBilling.md`
- `docs/features/Phase1_AuthSyncedBYOK.md`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Foundation scan only |

## Objective

Capture the user request, scan the repo, and create a Build-stage orchestration session for Neon-backed cross-device accounts, BYOK/app-managed mode selection, and GPT-OSS model alignment.

## Scope

- Inspect major desktop, mobile, shared-core, and docs files.
- Record existing assumptions and mismatches.
- Create session docs and task decomposition.

## Context

The existing feature docs planned Convex and mobile BYOK-only. The current user request changes the product direction: use Neon and let signed-in users choose either their own API key or normal app-managed allocation across mobile and PC/desktop.

## Definition Of Done

- [x] Existing docs and relevant code paths are identified.
- [x] Master plan is written.
- [x] Follow-up task packets are scoped.

## Expected Artifacts

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- This completed task packet.

## Constraints

- Do not implement broad security-sensitive auth before design review.
- Do not assume a nonexistent GPT-OSS model ID.

## Verification

- Manual repo scan completed using `find`, `rg`, and file reads.
