# Task 05_desktop_account_mode_integration: Desktop account/account-mode integration
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Wire desktop to sign-in, account status, mode selection, and authenticated processing.
## Scope
- None specified.
## Context
Parent session: orch-20260605-180656

Task title: Desktop account/account-mode integration
## Definition Of Done
- Desktop auth UI/API wiring exists
- Account mode visible/selectable
- Local fallback preserved
- No secrets logged
## Expected Artifacts
- Desktop source changes
## Dependencies
- 02_neon_auth_account_mode_architecture
- 04_backend_auth_neon_account_modes
## Constraints
- Complete the task within scope.
- Use the assigned workflow and any listed skill/context overlays when they are available; otherwise rely on the harness defaults and repo source of truth.
- Report blockers clearly.
- Summarize what changed and what remains.