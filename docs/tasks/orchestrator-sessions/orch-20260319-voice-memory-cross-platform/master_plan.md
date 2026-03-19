# Master Plan: Koe Voice Memory Cross-Platform

**Session ID:** orch-20260319-voice-memory-cross-platform  
**Created:** 2026-03-19T10:30:00Z  
**Source:** User request for audio upload, in-app correction memory, and learn-my-voice features across desktop and mobile using Takomi + Vibe Genesis workflows  
**Status:** Planned

## Overview

This orchestrator session defines the next shared product phase for Koe across:
- **Desktop (Electron)**
- **Mobile (Expo iOS/Android app)**

The session covers the agreed scope:
- **Audio file upload**
- **In-app transcript editing**
- **Correction memory inside Koe**
- **Lightweight learn-my-voice profile**
- **Short onboarding for names, brands, jargon, and preferred spellings**

This session does **not** include Android-only access experiments such as widgets, quick settings tiles, or IME work. Those are explicitly deferred into issue files for later handling.

## Product Decisions Locked For This Session

- "Learn my voice" means **personal vocabulary, names, jargon, spelling, casing, and style memory**, not true acoustic model adaptation.
- Correction learning happens **inside Koe-owned UI**, not by detecting edits in external apps.
- Mobile remains **app-first / clipboard-first** for this session.
- Audio file upload must work in both desktop and mobile.
- Desktop and mobile should share as much logic and data shape as practical through `@koe/core` or parallel storage contracts.

## Goals

1. Let users upload supported audio files and receive polished text.
2. Let users edit the last output or a history item inside Koe.
3. Persist user corrections as reusable memory.
4. Add a short onboarding flow for names and recurring terminology.
5. Reuse learned memory in future transcript/refinement requests.

## Non-Goals

- True acoustic personalization or model fine-tuning
- Android IME / keyboard service
- Android quick settings tiles or home screen widgets
- iOS custom keyboard dictation
- System-wide edit detection outside Koe
- Paid backend infrastructure or managed Koe accounts

## Cheapest-First Architecture

### Shared concepts
- `VoiceProfile`
  - user names
  - people names
  - brand names
  - acronyms
  - jargon
  - preferred spellings
  - optional style hints
- `CorrectionRule`
  - input text
  - preferred output text
  - source entry id
  - app/platform scope
  - count / confidence
- `EditableTranscriptEntry`
  - raw text
  - refined text
  - user-corrected text
  - learned rules applied

### Platform shape
- Desktop:
  - add upload entry point in settings/history flow
  - add edit-last-output and edit-history actions
  - persist correction memory in encrypted local storage
- Mobile:
  - add audio file picker/import flow
  - add edit-last-output and edit-history actions
  - persist correction memory and voice profile in SecureStore-backed app storage

## Skills Registry

| Skill | Relevant? | Inject Into | Reason |
|---|---|---|---|
| `takomi` | Yes | All tasks | Orchestration workflow and mode selection |
| `spawn-task` | Yes | This session | Task prompt structure |
| `context7` | Yes | Tasks 02-07 | Current docs for Electron, Expo, file pickers, and storage |
| `building-native-ui` | Yes | Tasks 03, 05, 06 | Mobile UX and Expo-native behavior |
| `frontend-design` | Yes | Tasks 04, 05, 06 | Clean edit and onboarding UX |
| `sync-docs` | Yes | Task 07 | Final doc sync |
| `webapp-testing` | Yes | Task 07 | Validate desktop flows where possible |

## Workflow Registry

| Workflow | Path | Use |
|---|---|---|
| `vibe-genesis` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-genesis.md` | Session blueprinting and issue mapping |
| `mode-architect` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-architect.md` | Architecture checks and design decisions |
| `vibe-primeAgent` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md` | Mandatory context priming |
| `vibe-build` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md` | Implementation tasks |
| `mode-code` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-code.md` | Focused coding tasks |
| `mode-review` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-review.md` | Review and verification |
| `vibe-syncDocs` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-syncDocs.md` | Documentation sync |

## Current Repo State

- Desktop app already supports:
  - microphone capture
  - transcription
  - refinement
  - clipboard / auto-paste
  - history and retry
- Mobile app already supports:
  - microphone capture
  - transcription
  - refinement
  - clipboard-first output
  - history and retry for failed sessions
- Missing in both:
  - audio file upload
  - transcript edit flow
  - correction-memory learning
  - voice-profile onboarding

## Tasks

| # | Task File | Status | Mode | Skills | Description |
|---|---|---|---|---|---|
| 01 | `01_shared_voice_memory_foundation.task.md` | Pending | vibe-architect/code | takomi, context7 | Define shared data model and storage contracts for voice profile and correction memory |
| 02 | `02_desktop_audio_file_upload.task.md` | Pending | vibe-code | takomi, context7 | Add audio file upload flow to desktop |
| 03 | `03_mobile_audio_file_upload.task.md` | Pending | vibe-code | takomi, context7, building-native-ui | Add audio file upload flow to mobile |
| 04 | `04_desktop_edit_and_learn.task.md` | Pending | vibe-code | takomi, frontend-design, context7 | Add edit-last-output and learn-from-correction flow on desktop |
| 05 | `05_mobile_edit_and_learn.task.md` | Pending | vibe-code | takomi, frontend-design, building-native-ui, context7 | Add edit-last-output and learn-from-correction flow on mobile |
| 06 | `06_onboarding_names_and_profile.task.md` | Pending | vibe-code | takomi, frontend-design, building-native-ui, context7 | Add short onboarding and profile management for names, brands, jargon, and preferred spellings |
| 07 | `07_integration_verification_and_docs.task.md` | Pending | vibe-review/code | takomi, sync-docs, webapp-testing, context7 | Wire learned memory into processing, verify flows, and update docs |

## Dependency Graph

```text
Task 01 Shared Voice Memory Foundation
    |
    +--> Task 02 Desktop Audio File Upload
    |
    +--> Task 03 Mobile Audio File Upload
    |
    +--> Task 04 Desktop Edit And Learn
    |
    +--> Task 05 Mobile Edit And Learn
    |
    +--> Task 06 Onboarding Names And Profile

Task 02 + Task 03 + Task 04 + Task 05 + Task 06
    |
    v
Task 07 Integration Verification And Docs
```

## Delivery Milestones

- **Milestone A:** Shared profile and correction-memory data structures exist.
- **Milestone B:** Desktop and mobile can both upload audio files.
- **Milestone C:** Desktop and mobile can both edit a transcript inside Koe and save corrections.
- **Milestone D:** Onboarding and settings expose user names, brands, jargon, and preferred spellings.
- **Milestone E:** Learned memory influences future transcript/refinement output and docs are updated.

## Deferred Later Work

These items are intentionally **not** part of this session and are tracked separately in `docs/issues/`:

- `FR-021` System-wide correction detection outside Koe
- `FR-022` True acoustic personalization / speaker adaptation
- `FR-023` Android quick settings tile and widget entry points
- `FR-024` Android IME / keyboard integration

## Session Path

`docs/tasks/orchestrator-sessions/orch-20260319-voice-memory-cross-platform/`
