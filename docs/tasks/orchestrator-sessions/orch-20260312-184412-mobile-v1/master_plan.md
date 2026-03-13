# Master Plan: Koe Mobile V1

**Session ID:** orch-20260312-184412-mobile-v1  
**Created:** 2026-03-12T17:44:12Z  
**Source:** User request for a cross-platform mobile version, Takomi orchestrator session  
**Status:** In Progress

## Overview

This orchestrator session breaks the Koe mobile effort into discrete execution tasks for a small team.

The agreed product shape is:
- **Cross-platform app-first mobile V1**
- **Expo + small native modules**
- **Direct BYOK processing to Groq**
- **Clipboard-first output on mobile**
- **No keyboard extension in V1**

The current repo is a production-oriented Electron desktop app. The mobile work should reuse the transcription and session logic where practical, but it must not block on unresolved macOS issues.

## Key Product Constraints

- iOS custom keyboards cannot provide the microphone-based dictation flow the user originally wanted.
- Android can eventually support an IME-based experience, but that is a later, Android-only phase and is not part of this session.
- Desktop remains at the repo root for now. The mobile effort adds workspace structure around it rather than moving the existing desktop app into a new folder.
- New mobile and shared packages may use TypeScript. The existing Electron app remains JavaScript unless a task explicitly migrates a boundary.

## Skills Registry

| Skill | Relevant? | Inject Into | Reason |
|---|---|---|---|
| `takomi` | Yes | All tasks | Orchestration workflow and mode selection |
| `spawn-task` | Yes | This session | Task prompt generation format |
| `monorepo-management` | Yes | Tasks 01-03 | Add workspace structure safely |
| `building-native-ui` | Yes | Tasks 03-05 | Expo Router and native UI guidance |
| `context7` | Yes | Tasks 01-06 | Current Expo and library docs |
| `upgrading-expo` | Yes | Task 03 | Expo setup and dependency hygiene |
| `security-audit` | Yes | Task 06 | Mobile security and release review |
| `sync-docs` | Yes | Task 07 | Keep docs aligned with the new mobile architecture |

## Workflow Registry

| Workflow | Path | Use |
|---|---|---|
| `mode-architect` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-architect.md` | Decisions and architecture checks |
| `vibe-build` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md` | Implementation tasks |
| `mode-code` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-code.md` | Focused coding tasks |
| `mode-review` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-review.md` | Review and verification |
| `review_code` | `C:/Users/johno/.codex/skills/takomi/workflows/review_code.md` | Final review pass |
| `vibe-syncDocs` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-syncDocs.md` | Documentation sync |
| `vibe-primeAgent` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md` | Mandatory context priming |

## Current Repo State

- Desktop app is Electron + Vite at the repo root.
- Core reusable logic exists in:
  - `src/main/services/transcription-session-manager.js`
  - `src/main/services/groq.js`
  - `src/renderer/audio/vad.js`
- Mobile client does not exist yet.
- The repo already uses `pnpm`, so workspaces are the cleanest expansion path.

## Tasks

| # | Task File | Status | Mode | Skills | Description |
|---|---|---|---|---|---|
| 01 | `01_workspace_foundation.task.md` | Completed | vibe-code | takomi, monorepo-management, context7 | Add workspace structure without breaking desktop |
| 02 | `02_shared_core_extraction.task.md` | Completed | vibe-code | takomi, context7 | Extract portable transcription/session logic |
| 03 | `03_mobile_app_scaffold.task.md` | Completed | vibe-code | takomi, building-native-ui, upgrading-expo, context7 | Create Expo mobile shell and navigation |
| 04 | `04_mobile_recording_pipeline.task.md` | Completed | vibe-code | takomi, building-native-ui, context7 | Implement recording, segmentation, provider calls, retry |
| 05 | `05_mobile_product_shell.task.md` | Completed | vibe-code | takomi, building-native-ui, context7 | Build recorder UX, history, settings, clipboard flow |
| 06 | `06_release_hardening_review.task.md` | In Progress | vibe-review | takomi, security-audit, context7 | Verify security, build, and device readiness |
| 07 | `07_docs_handoff.task.md` | Pending | vibe-code | takomi, sync-docs | Update docs and handoff materials |

## Dependency Graph

```text
Task 01 Workspace Foundation
    |
    +--> Task 02 Shared Core Extraction
    |
    +--> Task 03 Mobile App Scaffold
              |
              +--> Task 04 Mobile Recording Pipeline
              |
              +--> Task 05 Mobile Product Shell
                        ^
                        |
                  Task 04 output feeds Task 05
                              |
                              v
                  Task 06 Release Hardening Review
                              |
                              v
                      Task 07 Docs Handoff
```

## Delivery Milestones

- **Milestone A:** Workspace exists, desktop still runs, mobile app boots.
- **Milestone B:** Shared core package owns provider/session logic and desktop consumes it.
- **Milestone C:** Mobile can record, process, retry, and copy output to clipboard.
- **Milestone D:** Security/release review passes and docs reflect the new architecture.

## Defaults And Non-Goals

- V1 mobile recording is **manual start/stop**, not keyboard-triggered.
- V1 mobile output is **clipboard-first**, not system-wide auto-paste.
- V1 mobile may use background-safe recording and processing where the platform allows, but it should degrade gracefully if the OS suspends the app.
- Android IME work is explicitly out of scope for this session.
- Paid Koe accounts and a managed processing backend are out of scope for this session.

## Session Path

`docs/tasks/orchestrator-sessions/orch-20260312-184412-mobile-v1/`
