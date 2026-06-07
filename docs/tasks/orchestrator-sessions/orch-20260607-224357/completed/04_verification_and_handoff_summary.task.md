# Task 04: Verification and Handoff Summary

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

Takomi `vibe-build` final review. Synthesize all findings/fixes, run a verification gate, and write a concise handoff.

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260607-224357/master_plan.md`
- Outputs from Tasks 01-03
- `docs/Builder_Handoff_Report.md` for existing project reporting style

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Standard verification/handoff. |

## Objective

Produce a final stabilization report: what was fixed, what still requires manual Android APK validation, what commands passed, and exact QA steps for browser/mobile/desktop history.

## Scope

- Run appropriate type-check/build/lint commands based on changed files.
- Summarize code changes and residual risks.
- Add/update a feature or task report if useful.

## Definition Of Done

- Verification status is clear.
- Manual QA steps are actionable.
- User can understand the stance, fixes, and next step without reading subagent logs.

## Expected Artifacts

- Final summary in orchestrator response and optional markdown report.

## Constraints

- Do not claim Android upgrade is fixed unless source/config root cause is corrected and manual APK install path is validated or clearly marked pending.
