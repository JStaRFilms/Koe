# Master Plan: Koe Production Readiness

**Session ID:** orch-20260302-021500  
**Created:** 2026-03-02T02:16:00Z  
**Source:** Vision Brief + User Production Readiness Request  
**Status:** Complete ✅

## Overview

This orchestrator session coordinates the **Production Readiness** phase for Koe (声) — a voice dictation desktop app. The core transcription pipeline works (mic → VAD → Groq Whisper → auto-paste). Critical bugs have been fixed. Now we need to:

1. **Connect disconnected features** (History, Usage Meter have no UI containers)
2. **Implement COULD features** (FR-016 through FR-020)
3. **Security audit**
4. **Final testing & build**

## Skills Registry

| Skill | Relevant? | Inject Into | Reasoning |
|-------|-----------|-------------|-----------|
| `security-audit` | ✅ Yes | Task 04 | Deep security review of Electron app |
| `webapp-testing` | ✅ Yes | Task 05 | Test the Electron app |
| `frontend-design` | ✅ Yes | Tasks 01-02 | Premium UI for settings window |
| `ui-ux-pro-max` | ✅ Yes | Tasks 01-02 | Color palette, typography guidelines |

## Current State (From Vision Brief & Code Review)

### ✅ Implemented (Working)
- FR-001 through FR-013: Core pipeline, UI, tray, settings, AI enhancement, auto-paste

### ⚠️ Disconnected (Code Exists, Not Accessible)
- FR-014: History Panel — Component exists but NO UI container
- FR-015: Usage Dashboard — Component exists but NO UI container
- Settings Panel — Only shown on first launch, no way to reopen

### ⏳ Not Implemented (COULD Features)
- FR-016: Custom AI Prompt (backend ready, needs UI verification)
- FR-017: Speed vs Accuracy Toggle (model selection)
- FR-018: Custom Hotkey Configuration
- FR-019: Dark/Light Theme Toggle
- FR-020: Export Transcriptions

## Tasks

| # | Task File | Status | Mode | Skills | Description |
|---|-----------|--------|------|--------|-------------|
| 01 | 01_settings_window.task.md | ✅ Complete | vibe-code | frontend-design, ui-ux-pro-max | Create settings window infrastructure |
| 02 | 02_connect_panels.task.md | ✅ Complete | vibe-code | frontend-design | Connect History & Usage panels |
| 03 | 03_could_features.task.md | ✅ Complete | vibe-code | frontend-design | Implement FR-016 to FR-020 |
| 04 | 04_security_audit.task.md | ✅ Complete | vibe-review | security-audit | Security review |
| 05 | 05_final_testing.task.md | ✅ Complete | vibe-code | webapp-testing | Integration testing & build |
| 06 | 06_documentation.task.md | ✅ Complete | vibe-code | - | Update issue files & handoff report |

## Progress

- [x] Phase 1: Settings Window Infrastructure (Task 01)
- [x] Phase 2: Connect Panels (Task 02)
- [x] Phase 3: COULD Features (Task 03)
- [x] Phase 4: Security Audit (Task 04)
- [x] Phase 5: Testing & Build (Task 05)
- [x] Phase 6: Documentation (Task 06)

## Final Status Summary

### Features Delivered
All 20 Feature Requests (FR-001 to FR-020) are now complete:

| Category | Count | Status |
|----------|-------|--------|
| MUS Features (Must-Have) | 10 | ✅ All Complete |
| SHOULD Features | 5 | ✅ All Complete |
| COULD Features | 5 | ✅ All Complete |

### Key Deliverables
- **Settings Window:** 600×500px frameless window with tabbed interface (Settings/History/Usage)
- **History Panel:** Full implementation with copy, expand, clear, and export functionality
- **Usage Dashboard:** Visual meters for rate limits with real-time updates
- **COULD Features:** Custom hotkey, theme toggle, model selection, prompt styles, export

### Build Status
| Check | Status |
|-------|--------|
| Vite Build | ✅ Pass |
| Electron Builder | ✅ Pass |
| Installer Created | ✅ 118 MB |

### Security Status
| Issue | Severity | Status |
|-------|----------|--------|
| Hardcoded Encryption Key | P0 Critical | ⚠️ Must Fix Before Release |
| XSS in History Panel | P0 Critical | ⚠️ Must Fix Before Release |
| Missing CSP Headers | P1 High | Recommended Fix |
| No Input Validation | P1 High | Recommended Fix |

### Release Readiness
**Ready for Internal Testing:** ✅ Yes
**Ready for Production:** ❌ No (Security blockers)

**Action Required:** Fix 2 P0 security issues before public release.

## Dependencies

```
Task 01 (Settings Window)
    │
    ▼
Task 02 (Connect Panels) ──► Task 03 (COULD Features)
    │                              │
    └──────────────────────────────┘
                   │
                   ▼
          Task 04 (Security Audit)
                   │
                   ▼
          Task 05 (Testing & Build)
                   │
                   ▼
          Task 06 (Documentation)
```

## Notes

- The pill window (400x68px) is TOO SMALL for settings/history/usage — create a separate window
- Existing components (SettingsPanel, HistoryPanel, UsageMeter) are well-written — reuse them
- Keep the pill UI focused — it's the main interaction point
- Settings window should be frameless with custom title bar for consistency
- All windows must have proper focus management

## Session Path

`docs/tasks/orchestrator-sessions/orch-20260302-021500/`
