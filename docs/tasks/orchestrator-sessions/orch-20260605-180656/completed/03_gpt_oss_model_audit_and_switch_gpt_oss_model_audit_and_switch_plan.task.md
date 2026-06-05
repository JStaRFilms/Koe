# Task 03_gpt_oss_model_audit_and_switch: GPT-OSS model audit and switch plan
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Ensure app code uses GPT-OSS instead of disabled Kimi K2 for refinement.
## Scope
- None specified.
## Context
Parent session: orch-20260605-180656

Task title: GPT-OSS model audit and switch plan
## Definition Of Done
- No active mobile/desktop app code uses Kimi K2
- GPT-OSS model constant is centralized
- Relevant checks pass
## Expected Artifacts
- Diff or no-op audit result
## Dependencies
- 01_foundation_intake
## Constraints
- Complete the task within scope.
- Use the assigned workflow and any listed skill/context overlays when they are available; otherwise rely on the harness defaults and repo source of truth.
- Report blockers clearly.
- Summarize what changed and what remains.