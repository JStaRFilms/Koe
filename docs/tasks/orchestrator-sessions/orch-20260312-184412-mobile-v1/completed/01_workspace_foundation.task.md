# Task 01: Workspace Foundation For Mobile

**Session ID:** orch-20260312-184412-mobile-v1  
**Source:** Takomi mobile orchestrator  
**Priority:** P0  
**Dependencies:** None  
**Created At:** 2026-03-12T17:45:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Read and follow:
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md`
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`

### Prime Agent Context
> MANDATORY: run the Takomi prime-agent workflow first.  
> Then read:
> - `docs/Coding_Guidelines.md`
> - `docs/Builder_Prompt.md`
> - `docs/tasks/orchestrator-sessions/orch-20260312-184412-mobile-v1/master_plan.md`

### Required Skills
> Load these skills before coding:
>
> | Skill | Path | Why |
> |---|---|---|
> | `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Workflow orchestration |
> | `monorepo-management` | `C:/Users/johno/.codex/skills/monorepo-management/SKILL.md` | Add workspace structure safely |
> | ` | Verify current pnpm and Expo monorepo guidance |

### Check Additional Skills
> Scan the available skills list and load anything clearly relevant before editing.

---

## Objective

Introduce the minimum repo structure needed for a mobile client and shared packages **without breaking the current desktop app**.

This task creates the foundation only. It does not extract desktop logic or build mobile features.

## Scope

**In scope:**
- Add a workspace layout compatible with `pnpm`
- Keep the Electron app at the repo root
- Add `apps/mobile/` for the Expo app
- Add `packages/koe-core/` for shared logic
- Add root scripts and config needed to develop both targets
- Add base TypeScript config only for new workspace packages

**Out of scope:**
- Moving the current Electron app into `apps/desktop`
- Extracting business logic into `packages/koe-core`
- Implementing the mobile app UI or recording pipeline

## Context

The existing repo already has:
- root `package.json`
- Electron entrypoints under `src/main`
- renderer code under `src/renderer`
- reusable logic that will later move into `packages/koe-core`

The agreed migration strategy is conservative:
1. Keep desktop where it is
2. Add workspace infrastructure around it
3. Add new packages and apps incrementally

## Requirements

### Workspace Structure

Create or update the repository to support this structure:

```text
apps/
  mobile/
packages/
  koe-core/
pnpm-workspace.yaml
tsconfig.base.json
```

### Root Package Rules

- Root package remains the desktop app package
- Existing desktop scripts must keep working or be updated with a clear equivalent
- Add new scripts for mobile and shared-package development
- Do not remove current desktop build scripts

### Mobile Workspace Rules

- `apps/mobile` should be present as a valid Expo project shell
- It may contain only scaffold/config files in this task
- It must be ready for Task 03 to extend, not rebuilt from scratch

### Shared Package Rules

- `packages/koe-core` should exist with package metadata and placeholder entrypoints
- Exports must be set up so desktop and mobile can consume the package later
- Prefer a simple, explicit build path over clever tooling

### Config Rules

- Add `pnpm-workspace.yaml`
- Add a base TS config for new TS packages
- Add any Metro/Expo workspace compatibility config only if needed for the scaffold to resolve packages cleanly
- Do not force TypeScript onto the legacy desktop codebase in this task

## Files To Create Or Modify

| File | Action | Purpose |
|---|---|---|
| `pnpm-workspace.yaml` | Create | Declare workspace packages |
| `tsconfig.base.json` | Create | Shared TS defaults for new packages |
| `apps/mobile/package.json` | Create | Expo app package scaffold |
| `apps/mobile/app.json` or `app.config.*` | Create | Expo config |
| `apps/mobile/tsconfig.json` | Create | Mobile TS config |
| `packages/koe-core/package.json` | Create | Shared package manifest |
| `packages/koe-core/src/index.ts` | Create | Shared package entrypoint placeholder |
| `package.json` | Modify | Add workspace-aware scripts |
| `.gitignore` | Modify if needed | Ignore mobile/build artifacts |

## Definition Of Done

- [ ] `pnpm install` still succeeds at the repo root
- [ ] Existing desktop scripts remain usable
- [ ] `apps/mobile` exists as a valid Expo app scaffold
- [ ] `packages/koe-core` exists as a valid shared package scaffold
- [ ] Root scripts include a clear way to start mobile development
- [ ] No desktop runtime behavior changes are introduced
- [ ] A short README note or inline comments explain how to run desktop vs mobile

## Expected Artifacts

- Workspace config committed in repo
- Scaffolded mobile app folder ready for feature work
- Shared package folder ready for extraction work

## Constraints

- Preserve current desktop behavior
- Keep the migration incremental
- Use ASCII only
- Prefer minimal config over a heavy workspace toolchain
- Do not add auth, backend, or Android IME work here

## Verification

- Run the root install flow
- Run the desktop dev command or an equivalent smoke check
- Run the mobile app package install/start validation far enough to confirm the scaffold is sound
- Capture any follow-up issues in the task result if a later task must handle them

---

*Generated by Takomi orchestrator | Session: orch-20260312-184412-mobile-v1*
