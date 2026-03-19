# Master Plan: Android IME Voice Keyboard

**Session ID:** orch-20260319-android-ime-voice-keyboard  
**Created:** 2026-03-19T18:20:00Z  
**Source:** User-approved Takomi orchestration session for building Koe as an Android voice-input IME  
**Status:** Planned

## Overview

This orchestrator session defines the Android-first keyboard phase for Koe.

The goal is to ship **Koe Voice** as an Android input method that lets the user:
- open any text field
- switch to Koe from the Android keyboard picker
- tap the Koe mic
- speak naturally
- receive final refined text inserted directly into the focused field

The existing mobile Expo app remains the control center for:
- onboarding
- API key management
- dictation settings
- transcript history
- enablement guidance for the Android keyboard

## Product Decisions Locked For This Session

- Android only for IME v1.
- Koe will be a **voice-input IME**, not a full Gboard competitor.
- We are **not** integrating into Samsung Keyboard, Gboard, or other third-party keyboards.
- The IME inserts **final refined text**, not live streaming partial text.
- Clipboard fallback remains available if direct insertion fails.
- The host app remains the place for settings, onboarding, and history.
- Quick Settings tiles, widgets, and iOS keyboard work are out of scope for this session.

## Goals

1. Create a native Android IME service that appears in Android's keyboard list.
2. Let the user trigger Koe dictation directly from the keyboard surface.
3. Insert final text into the currently focused input field with sane fallback behavior.
4. Reuse existing Koe settings and transcript rules where practical.
5. Keep scope tight enough to ship a reliable v1 voice keyboard.

## Non-Goals

- Full QWERTY keyboard implementation
- Samsung Keyboard or Gboard plug-in style integration
- Quick Settings tile or widget entry points
- iOS custom keyboard parity
- Live partial text insertion while audio is still being processed
- Acoustic personalization or speaker adaptation
- Background ambient listening while the keyboard is hidden

## Current Repo State

- `apps/mobile` is an Expo Router app with **no checked-in native `android/` project yet**.
- Mobile dictation currently runs from React Native UI and copies final text to clipboard.
- Mobile settings and API key are stored through Expo SecureStore.
- `@koe/core` already contains reusable prompt, provider, text, and session helpers, but the current mobile recording pipeline is tied to React hooks and app UI.
- Existing backlog item `FR-024` already reserves Android IME work and should now point at this execution session.

## Cheapest-First Architecture

### Product shape
- **Host app**
  - onboarding
  - API key entry
  - settings
  - history
  - "Enable Koe Keyboard" education flow
- **Android IME**
  - input method service
  - minimal voice-first input view
  - record / stop / cancel actions
  - direct text insertion through the active input connection

### Shared logic boundary
- Keep shared in `@koe/core`:
  - prompt defaults
  - transcript cleanup helpers
  - settings types
  - text normalization and output shaping
- Keep platform-specific:
  - Android IME lifecycle
  - microphone capture in the IME
  - insertion into focused fields
  - host-app-to-IME storage bridge

### Storage strategy
- Do **not** assume Expo SecureStore can be read directly by the IME service.
- Introduce a native Android storage contract for:
  - API key access
  - active model/language/prompt settings
  - enhancement toggle
  - optional last-result / retry state
- The React Native host app and IME should both read/write the same Android-native storage boundary.

## Skills Registry

| Skill | Relevant? | Inject Into | Reason |
|---|---|---|---|
| `takomi` | Yes | All tasks | Orchestration workflow and session structure |
| `avoid-feature-creep` | Yes | Tasks 01-06 | Prevent accidental expansion into a full keyboard product |
| `context7` | Yes | Tasks 01-07 | Verify current Android IME, Expo native, and storage docs |
| `building-native-ui` | Yes | Tasks 02, 06 | Host app UX and mobile-native setup flows |
| `frontend-design` | Yes | Task 06 | Make enablement/onboarding UI clear and intentional |
| `sync-docs` | Yes | Task 07 | Keep docs aligned with the implementation |

## Workflow Registry

| Workflow | Path | Use |
|---|---|---|
| `mode-orchestrator` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-orchestrator.md` | Session breakdown and coordination |
| `mode-architect` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-architect.md` | Native boundary and platform decision validation |
| `vibe-primeAgent` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md` | Mandatory context priming |
| `vibe-build` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md` | Implementation tasks |
| `mode-code` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-code.md` | Focused coding execution |
| `mode-review` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-review.md` | Verification and risk review |
| `vibe-syncDocs` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-syncDocs.md` | Doc updates after build |

## Tasks

| # | Task File | Status | Mode | Skills | Description |
|---|---|---|---|---|---|
| 01 | `01_android_ime_architecture_and_native_boundary.task.md` | Pending | vibe-architect/code | takomi, avoid-feature-creep, context7 | Define the IME architecture, native storage boundary, and minimal v1 contract |
| 02 | `02_android_native_project_and_ime_registration.task.md` | Completed | vibe-code | takomi, context7 | Generate the Android native project, register the IME service, and make Koe show up in the keyboard list |
| 03 | `03_voice_input_view_and_commit_text_prototype.task.md` | Pending | vibe-code | takomi, avoid-feature-creep, context7 | Build the minimal voice keyboard UI and prove text insertion with a static commit prototype |
| 04 | `04_ime_audio_capture_and_session_state.task.md` | Pending | vibe-code | takomi, context7 | Add microphone capture, session lifecycle, and in-keyboard status handling |
| 05 | `05_ime_transcription_refinement_and_insert.task.md` | Pending | vibe-code | takomi, context7 | Connect the IME to Groq transcription/refinement and insert final text into the focused field |
| 06 | `06_host_app_enablement_settings_and_history_bridge.task.md` | Pending | vibe-code | takomi, building-native-ui, frontend-design, context7 | Add host-app UX for enabling the keyboard, sharing settings, and surfacing IME history/retry state |
| 07 | `07_android_ime_verification_fallbacks_and_docs.task.md` | Pending | vibe-review/code | takomi, sync-docs, context7 | Verify flows, harden clipboard fallback/error handling, and update docs |

## Dependency Graph

```text
Task 01 Android IME Architecture And Native Boundary
    |
    +--> Task 02 Android Native Project And IME Registration
    |       |
    |       +--> Task 03 Voice Input View And Commit Text Prototype
    |               |
    |               +--> Task 04 IME Audio Capture And Session State
    |                       |
    |                       +--> Task 05 IME Transcription Refinement And Insert
    |
    +--> Task 06 Host App Enablement Settings And History Bridge

Task 05 + Task 06
    |
    v
Task 07 Android IME Verification Fallbacks And Docs
```

## Delivery Milestones

- **Milestone A:** Android native project exists and Koe appears in Android's enabled keyboard list.
- **Milestone B:** Koe IME can insert static text into a focused field.
- **Milestone C:** Koe IME can record audio and show in-keyboard session state.
- **Milestone D:** Koe IME can transcribe, refine, and insert final text with clipboard fallback.
- **Milestone E:** Host app supports setup, settings sharing, and user guidance for the keyboard flow.
- **Milestone F:** Docs and verification cover the IME install, enablement, and failure modes.

## Key Risks And Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Expo SecureStore is not directly readable by the IME | High | High | Introduce shared native Android storage and move IME-needed settings behind it |
| IME lifecycle interrupts recording or network calls | High | Medium | Keep dictation explicit, user-initiated, and tied to visible keyboard state |
| Scope drifts into a full custom keyboard product | High | High | Lock v1 to voice-first controls only and defer full text layout |
| Some apps or secure fields reject insertion | Medium | Medium | Fall back to clipboard and clear user messaging |
| Prebuild/native changes destabilize Expo workflow | Medium | Medium | Isolate Android native work carefully and document dev-build expectations |

## Assumptions

- We will use a development build / prebuild-based Android workflow rather than Expo Go for IME work.
- The IME will be implemented with native Android components.
- Network calls for transcription may live in native Android code or a carefully bridged shared layer, but we will not force the IME to depend on a React hook.
- The initial IME UI should remain minimal and voice-centric.

## Session Path

`docs/tasks/orchestrator-sessions/orch-20260319-android-ime-voice-keyboard/`
