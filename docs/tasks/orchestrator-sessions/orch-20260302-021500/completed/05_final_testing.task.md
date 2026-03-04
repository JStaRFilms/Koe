# Task 05: Final Testing & Build Verification

**Session ID:** orch-20260302-021500  
**Source:** Production Readiness Orchestrator  
**Context:** Phase 4 — Testing and Build  
**Priority:** P0 (Critical)  
**Dependencies:** Task 01, Task 02, Task 03, Task 04  
**Created At:** 2026-03-02T02:21:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Required Skills
> **Load these skills before starting work:**
>
> | Skill | Relative Path | Why |
> |-------|---------------|-----|
> | `webapp-testing` | `C:/Users/johno/.kilocode/skills/webapp-testing/SKILL.md` | Test Electron app |
>
> **How to load:** Read the SKILL.md file and follow its instructions.

---

## 📋 Objective

Perform comprehensive end-to-end testing of all features and verify the production build works correctly.

## 🎯 Scope

**In Scope:**
- End-to-end testing of all features
- Settings persistence verification
- Hotkey customization testing
- Theme switching testing
- Export functionality testing
- Build verification (`pnpm build`)
- Installer creation verification
- App launch from built package

**Out of Scope:**
- Fixing bugs found (create new tasks)
- Cross-platform testing (Windows only for now)
- Performance benchmarking

## 📚 Context

### Test Environment

- Platform: Windows 11
- Node.js: Check `package.json` for requirements
- Package manager: pnpm (from lockfile)

### Build Commands

From `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && electron-builder",
    "preview": "vite preview"
  }
}
```

### Features to Test

#### Core Features (FR-001 to FR-013)
1. **Global Hotkey** — Press Ctrl+Shift+Space, recording starts
2. **Mic Capture** — Audio captured from microphone
3. **VAD** — Recording stops after silence
4. **Chunking** — Audio chunked and encoded as WAV
5. **Groq Transcription** — Text received from API
6. **Rate Limiting** — Requests queued if limit reached
7. **Floating Pill UI** — Visual feedback during recording
8. **Clipboard** — Text copied to clipboard
9. **System Tray** — Right-click menu works
10. **Settings API Key** — Key saved and used
11. **AI Enhancement** — Text cleaned up
12. **Language Selection** — Language detected or specified
13. **Auto-Paste** — Text pasted to active window

#### New Features (FR-014 to FR-020)
14. **History Panel** — Shows transcription history
15. **Usage Dashboard** — Shows rate limit meters
16. **Custom AI Prompt** — Prompt style selection works
17. **Speed vs Accuracy** — Model selection works
18. **Custom Hotkey** — Hotkey can be changed
19. **Theme Toggle** — Dark/Light themes work
20. **Export Transcriptions** — History exports correctly

### Test Scenarios

#### Scenario 1: Basic Transcription Flow
```
1. Launch app
2. Press hotkey (Ctrl+Shift+Space)
3. Speak: "Hello world, this is a test"
4. Wait for processing
5. Verify text appears in focused window (auto-paste)
6. Verify history shows entry
```

#### Scenario 2: Settings Persistence
```
1. Open Settings
2. Change language to "Spanish"
3. Change theme to "Light"
4. Change hotkey to "Alt+Shift+R"
5. Close app
6. Relaunch app
7. Verify all settings persisted
```

#### Scenario 3: Custom Hotkey
```
1. Open Settings
2. Change hotkey to "F12"
3. Save
4. Verify old hotkey (Ctrl+Shift+Space) no longer works
5. Verify new hotkey (F12) works
6. Change back to default
```

#### Scenario 4: Theme Toggle
```
1. Open Settings
2. Switch to Light theme
3. Verify pill window updates
4. Verify settings window updates
5. Close and reopen — theme should persist
```

#### Scenario 5: Export History
```
1. Make 3-4 transcriptions
2. Open History
3. Click Export
4. Save as .txt
5. Verify file content and format
6. Repeat with .md
```

#### Scenario 6: Model Selection
```
1. Open Settings
2. Switch to "Accurate (Large-v3)"
3. Make transcription
4. Check logs or network to verify model used
5. Switch back to "Fast"
```

#### Scenario 7: Settings Window
```
1. Click tray icon → Settings...
2. Verify Settings tab opens
3. Click tray icon → History...
4. Verify History tab opens
5. Click tray icon → Usage...
6. Verify Usage tab opens
```

## ✅ Definition of Done

### Testing Checklist
- [ ] Core transcription flow works end-to-end
- [ ] Settings persist after restart
- [ ] Custom hotkey can be set and works
- [ ] Theme toggle switches both windows
- [ ] Export saves correct file format
- [ ] Model selector switches Whisper model
- [ ] Prompt style selection works
- [ ] History panel shows entries correctly
- [ ] Usage panel shows meters correctly
- [ ] All tray menu items work

### Build Verification
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds without errors
- [ ] Installer created in `dist/` folder
- [ ] App launches from built package
- [ ] No console errors in production build
- [ ] All features work in production build

### Documentation
- [ ] Test results documented
- [ ] Any issues found logged
- [ ] Build verification report created

## Test Results Format

Create `docs/test-results.md`:

```markdown
# Koe Production Test Results

**Date:** [Date]
**Tester:** [Agent/Mode]
**Build:** [Version/Commit]

## Test Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Core Features | 13 | X | Y |
| New Features | 7 | X | Y |
| Settings | 4 | X | Y |
| Build | 6 | X | Y |

## Detailed Results

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| FR-001 Global Hotkey | ✅/❌ | |
| FR-002 Mic Capture | ✅/❌ | |
| ... | | |

### New Features

| Feature | Status | Notes |
|---------|--------|-------|
| FR-014 History Panel | ✅/❌ | |
| ... | | |

## Issues Found

### Issue 1: [Title]
**Severity:** Critical/High/Medium/Low
**Description:** What happened
**Steps to Reproduce:** 
1. Step 1
2. Step 2
**Expected:** What should happen
**Actual:** What happened
**Screenshot/Log:** [If available]

## Build Verification

| Check | Status | Details |
|-------|--------|---------|
| pnpm build | ✅/❌ | |
| Installer created | ✅/❌ | |
| App launches | ✅/❌ | |
| No console errors | ✅/❌ | |

## Sign-off

**Ready for Release:** Yes/No
**Blockers:** [List any]
```

## 🚫 Constraints

- Test on Windows 11 (the development environment)
- If bugs found, document them but don't fix (unless trivial)
- Verify BOTH development and production builds
- Test with actual microphone if possible, or mock

---

*Generated by vibe-orchestrator mode | Session: orch-20260302-021500*
