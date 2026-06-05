# Task 02: Neon Auth + Account-Mode Architecture

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-design`
- Role: architect

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- `docs/features/CentralizedAuthBilling.md`
- `docs/features/Phase1_AuthSyncedBYOK.md`
- `package.json`
- `koe-website/package.json`
- `apps/mobile/package.json`
- `packages/koe-core/src/constants.ts`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| context7 | Use only if external Neon/Next/auth library details are needed |

## Objective

Design the safest cross-device account architecture for simple email/password auth backed by Neon Postgres, supporting two account modes: user BYOK and Koe-managed allocation.

## Scope

- Recommend backend placement inside this repo.
- Define Neon schema tables and indexes.
- Define auth/session contracts for desktop and mobile.
- Define processing route contracts and mode resolution.
- Define secret/encryption requirements for BYOK credentials and managed provider keys.
- Identify a minimal first build slice vs later hardening.

## Context

The user wants users to sign in across mobile and desktop with the same account. Users should either bring an API key or use app-managed allocation so they do not have to worry about API keys. Current code stores Groq API keys locally on both desktop and mobile and uses direct Groq requests.

## Definition Of Done

- Architecture doc/report explains the recommended implementation approach.
- It explicitly calls out security risks and mitigations.
- It includes concrete API route names, request/response shapes, DB schema, and client storage rules.
- It distinguishes first shippable scaffold from production requirements.

## Expected Artifacts

- Architecture result for orchestrator synthesis.
- Suggested edits to feature docs if needed.

## Constraints

- Never expose Koe-managed Groq/API key to clients.
- Do not let clients self-assert managed entitlement or usage limits.
- Use app-level encryption for synced BYOK secrets.
- Keep mobile purchase/billing UI out of scope unless separately approved.

## Verification

- Check design against existing desktop and mobile call sites listed in the master plan.
