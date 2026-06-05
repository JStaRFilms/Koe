# Task 04: Backend Foundation for Email/Password, Neon, Sessions, Account Modes

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-build`
- Role: code

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- Task 02 architecture result once available
- `koe-website/package.json`
- `.env.example`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| context7 | Use only if current Neon/Next API docs are needed |

## Objective

Implement the first backend slice for Neon-backed users, email/password auth, sessions, and account modes.

## Scope

- Add necessary backend dependencies if approved by architecture.
- Add SQL/schema or migrations for users, sessions, credentials, account modes, settings, history, and usage.
- Add API routes for sign up, sign in, sign out/session revoke, account snapshot, mode selection, BYOK credential metadata/save/delete, and processing request entrypoint scaffold.
- Update environment example with Neon/database, auth secret, encryption secret, and managed provider key names.

## Context

This task depends on Task 02. Current repo has a Next website that can likely host API routes. No Neon dependency exists yet. The backend must support both desktop and mobile clients.

## Definition Of Done

- Backend compiles.
- Passwords are never stored raw.
- Sessions/tokens are not logged.
- BYOK credentials are encrypted before storage.
- Managed mode key stays server-side.
- API route contracts are documented.

## Expected Artifacts

- Backend source changes under the selected server area.
- Migration/schema files.
- `.env.example` updates.
- Short implementation result.

## Constraints

- Do not implement weak/plain password storage.
- Do not expose central managed key or encrypted BYOK plaintext to clients.
- Do not skip usage metering scaffold for managed allocation.

## Dependencies

- Task 02.

## Verification

- Server type check/build command selected by architecture.
- Manual API contract review.
