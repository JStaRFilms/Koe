# Task 02: Extract Shared Transcription Core

**Session ID:** orch-20260312-184412-mobile-v1  
**Source:** Takomi mobile orchestrator  
**Priority:** P0  
**Dependencies:** Task 01  
**Created At:** 2026-03-12T17:46:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Read and follow:
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md`
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`

### Prime Agent Context
> MANDATORY: run the Takomi prime-agent workflow first.  
> Then read:
> - `docs/tasks/orchestrator-sessions/orch-20260312-184412-mobile-v1/master_plan.md`
> - `src/main/services/transcription-session-manager.js`
> - `src/main/services/groq.js`
> - `src/shared/constants.js`

### Required Skills
> Load these skills before coding:
>
> | Skill | Path | Why |
> |---|---|---|
> | `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Workflow orchestration |
> | ` | Verify current package/export guidance |

### Check Additional Skills
> Scan the available skills list and load anything clearly relevant before editing.

---

## Objective

Create a portable shared core package that owns the reusable transcription/session logic needed by both desktop and mobile.

This task should reduce duplication without rewriting the desktop app wholesale.

## Scope

**In scope:**
- Create package-level types, helpers, and interfaces for provider calls and session orchestration
- Move or duplicate only the logic that is genuinely platform-agnostic
- Keep desktop-specific adapters in the Electron app
- Wire the desktop app to consume the shared package where safe

**Out of scope:**
- Rebuilding desktop UI or Electron process structure
- Implementing mobile UI
- Android IME work

## Context

The current reusable logic lives mainly in:
- `src/main/services/transcription-session-manager.js`
- `src/main/services/groq.js`
- selected helpers in `src/shared/constants.js`

The platform-specific pieces that must stay out of the shared package include:
- Electron IPC
- clipboard auto-paste
- tray and shortcuts
- Electron window messaging
- renderer mic capture implementation

## Shared Package Responsibilities

Define and implement these boundaries in `packages/koe-core`:

- `TranscriptionProvider`
  - `transcribeSegment(...)`
  - `refineTranscript(...)`
  - `checkConfiguration(...)`
- `SessionCoordinator`
  - ordered segment intake
  - commit sequencing
  - session completion logic
  - retry manifest state
- `UsageTracker`
  - request counting
  - audio-seconds accounting
  - daily reset helpers
- `TranscriptFormatting`
  - prompt resolution
  - transcript sanitization
  - segment joining helpers
- shared settings and payload types

## Extraction Rules

- Keep public interfaces small and explicit
- Avoid importing Electron APIs from the shared package
- Avoid importing Expo/React Native APIs from the shared package
- Use dependency injection for storage, logging, and output hooks
- Preserve current desktop behavior as the source-of-truth baseline

## Desktop Integration Requirements

- Update the desktop app to use the shared package for portable logic where the boundary is stable
- Preserve existing desktop runtime behavior
- Keep CommonJS compatibility on the Electron side
- If a small compatibility adapter is needed in desktop code, add it instead of forcing a large rewrite

## Files To Create Or Modify

| File | Action | Purpose |
|---|---|---|
| `packages/koe-core/src/index.ts` | Modify | Main exports |
| `packages/koe-core/src/providers/*` | Create | Provider interfaces and Groq implementation helpers |
| `packages/koe-core/src/session/*` | Create | Session coordinator logic |
| `packages/koe-core/src/usage/*` | Create | Usage accounting helpers |
| `packages/koe-core/src/types/*` | Create | Shared data contracts |
| `src/main/services/transcription-session-manager.js` | Modify | Consume shared coordinator pieces |
| `src/main/services/groq.js` | Modify | Consume shared prompt/sanitization/provider helpers |
| `src/shared/constants.js` | Modify only if needed | Shared defaults that still belong at app boundary |

## Definition Of Done

- [x] `packages/koe-core` exports a stable shared API ✅ Completed
- [x] Desktop reuses the extracted logic without feature regression ✅ Completed
- [x] No Electron-only code leaks into the shared package ✅ Completed
- [x] Provider/session contracts are usable by a future Expo app ✅ Completed
- [x] Existing desktop behavior for ordering, retry, and transcript cleanup is preserved ✅ Completed
- [x] The package can be imported cleanly from both desktop and mobile workspaces ✅ Completed

## Expected Artifacts

- Shared core package with clear public exports
- Updated desktop integration points
- Minimal migration notes inside the task result or package README if necessary

## Constraints

- Be conservative with extractions
- Do not change end-user behavior unless required to preserve compatibility
- Prefer adapter seams over deep rewrites
- Keep rate-limiting and transcript cleanup logic testable in isolation

## Verification

- Run desktop smoke checks covering transcription/refinement code paths as far as local tooling permits
- Verify imports resolve from the shared package
- Note any remaining desktop-only logic that mobile will need to reimplement separately

---

*Generated by Takomi orchestrator | Session: orch-20260312-184412-mobile-v1*
