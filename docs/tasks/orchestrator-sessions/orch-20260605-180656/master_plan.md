# Orchestrator Master Plan

## Overview

- **Session ID:** orch-20260605-180656
- **Product / Project:** Koe desktop + mobile voice dictation app
- **Mission:** Add cross-device account foundations so users can sign in with simple email/password, choose BYOK or Koe-managed allocation, and use the same account on mobile and desktop. Also verify mobile/desktop refinement uses GPT-OSS now that Kimi K2 is disabled.
- **Current Phase:** Vibe Build, with security-sensitive design-first sequencing.

## Context Intake

### Source of Truth

- User request: use GPT-OSS instead of disabled Kimi K2, add email/password users, use Neon for DB, support sign-in across mobile + PC, and offer two choices after sign-in: bring an API key or use the app normally with Koe-managed allocation.
- Existing docs: `docs/features/CentralizedAuthBilling.md`, `docs/features/Phase1_AuthSyncedBYOK.md`.
- Architecture result: `docs/tasks/orchestrator-sessions/orch-20260605-180656/02_neon_auth_account_mode_architecture.report.md`.
- Relevant code: desktop `src/main/services/groq.js`, mobile `apps/mobile/src/providers/mobile-provider.ts`, website API `koe-website/app/api/process/route.ts`, shared constants `packages/koe-core/src/constants.ts`.

### Known Constraints

- Current mobile and desktop primarily use local Groq API keys.
- `DEFAULT_ENHANCE_MODEL` is already `openai/gpt-oss-120b`; no active app code uses Kimi/K2.
- Neon should only be accessed server-side. Desktop/mobile call HTTPS backend routes.
- Managed allocation must be server-authoritative and must never expose the managed provider key to clients.
- BYOK secrets must be encrypted at rest before Neon persistence.
- Mobile should not show purchase/subscription UI in this slice.

### Assumptions

- “GPT OSS 12B” is ambiguous. Current safe default remains `openai/gpt-oss-120b` until an exact supported Groq model ID is confirmed.
- Existing `koe-website` Next API routes are the best backend host for the first slice.

### Risks

- Custom auth is security-sensitive: password hashing, opaque sessions, token storage, rate limiting, and reset/verification hardening matter.
- Managed allocation creates cost exposure and needs quotas/metering before public rollout.
- Cross-device sync touches desktop, mobile, backend, and history/settings boundaries.

## Skills Registry

| Overlay | Why it may help | Status |
|---|---|---|
| context7 | External Neon/Next/auth library lookup if implementation needs docs | Optional |
| ai-sdk | Possible future refactor of provider calls | Optional |

## Workflows Registry

| Stage | Workflow | Purpose |
|---|---|---|
| Genesis | vibe-genesis | Capture changed product direction and source of truth |
| Design | vibe-design | Design Neon/auth/account-mode/backend contracts |
| Build | vibe-build | Implement backend, desktop, mobile, and verification slices |
| Review | vibe-build review | Security and regression review |

## Task Table

| # | Subtask | Mode / Role | Workflow | Dependency | Status |
|---|---|---|---|---|---|
| 01 | Foundation intake and session setup | Orchestrator | vibe-genesis | none | completed |
| 02 | Neon auth + account-mode architecture | Architect | vibe-design | 01 | completed |
| 03 | GPT-OSS model audit and switch plan | Code | vibe-build | 01 | completed |
| 04 | Backend foundation for email/password, Neon, sessions, account modes | Code | vibe-build | 02 | in-progress |
| 05 | Desktop account/account-mode integration | Code | vibe-build | 02,04 | pending |
| 06 | Mobile account/account-mode integration | Code | vibe-build | 02,04 | pending |
| 07 | Cross-device verification, security review, handoff docs | Review | vibe-build | 03,04,05,06 | pending |

## Progress Checklist

- [x] Scan existing desktop, mobile, website API, shared core, and feature docs.
- [x] Create orchestration session and task packets.
- [x] Produce Neon/auth/account-mode architecture report.
- [x] Verify active app code already uses GPT-OSS (`openai/gpt-oss-120b`) and no runtime Kimi/K2 references remain.
- [ ] Implement Neon migrations and backend auth/account-mode scaffold.
- [ ] Add authenticated BYOK vault and account snapshot.
- [ ] Add server-side mode resolver and managed allocation scaffold.
- [ ] Add authenticated processing route scaffold.
- [ ] Wire desktop account UI/session/processing.
- [ ] Wire mobile account UI/session/processing.
- [ ] Run final security/regression review.

## Notes

- Preserve local BYOK as a migration/developer fallback, but make account mode the future normal path.
- Do not silently fall back between BYOK and managed during processing; typed errors should prompt users to switch.
- The same account must work across desktop and mobile through server sessions.
- Store only session token hashes in Neon. Store raw session tokens only on clients in secure storage.
- Keep desktop hotkey/auto-paste/window state and mobile retry blobs local-only.
