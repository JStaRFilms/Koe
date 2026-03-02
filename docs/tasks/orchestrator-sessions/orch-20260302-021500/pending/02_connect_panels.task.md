# Task 02: Connect History & Usage Panels

**Session ID:** orch-20260302-021500  
**Source:** Production Readiness Orchestrator  
**Context:** Part of Phase 2 — Connect disconnected features  
**Priority:** P0 (Critical)  
**Dependencies:** Task 01 (Settings Window Infrastructure)  
**Created At:** 2026-03-02T02:18:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Required Skills
> **Load these skills before starting work:**
>
> | Skill | Relative Path | Why |
> |-------|---------------|-----|
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | UI polish |
>
> **How to load:** Read the SKILL.md file and follow its instructions.

---

## 📋 Objective

Connect the existing HistoryPanel and UsageMeter classes to the new settings window. These components exist but have no HTML containers. This task creates the container structure and wires everything together.

## 🎯 Scope

**In Scope:**
- Update `src/renderer/settings-window.html` with proper containers for panels
- Update `src/renderer/settings-window.js` to initialize and manage panels
- Ensure History panel displays transcription entries
- Ensure Usage panel shows rate limit meters
- Add "Export" button placeholder (implementation in Task 03)
- Wire up IPC handlers for panel data

**Out of Scope:**
- Creating the settings window structure (done in Task 01)
- Implementing COULD features like custom hotkeys, themes (Task 03)
- Export functionality implementation (Task 03)

## 📚 Context

### HistoryPanel Requirements

The `HistoryPanel` class expects these DOM elements:
```javascript
this.container = document.getElementById('history-panel');
this.content = document.getElementById('history-content');
this.btnClose = document.getElementById('btn-close-history');
this.btnClear = document.getElementById('btn-clear-history');
this.btnCopyAll = document.getElementById('btn-copy-history');
```

It fetches data via: `window.api.getHistory()`  
It clears data via: `window.api.clearHistory()`

### UsageMeter Requirements

The `UsageMeter` class expects these DOM elements:
```javascript
this.container = document.getElementById('usage-meter');
this.barRpd = document.getElementById('bar-rpd');
this.barAudio = document.getElementById('bar-audio');
this.barRpm = document.getElementById('bar-rpm');
this.textRpd = document.getElementById('text-rpd');
this.textAudio = document.getElementById('text-audio');
this.textRpm = document.getElementById('text-rpm');
```

It fetches data via: `window.api.getUsageStats()`

### SettingsPanel Requirements

The `SettingsPanel` class expects these DOM elements:
```javascript
this.panel = document.getElementById('settings-panel');
this.btnClose = document.getElementById('btn-close-settings');
this.btnSave = document.getElementById('btn-save-settings');
this.btnToggleKey = document.getElementById('btn-toggle-key');
this.btnTestKey = document.getElementById('btn-test-key');
this.inputApiKey = document.getElementById('api-key');
this.selLanguage = document.getElementById('language');
this.chkEnhance = document.getElementById('enhance-text');
this.selPromptStyle = document.getElementById('prompt-style');
this.chkAutoPaste = document.getElementById('auto-paste');
this.testResult = document.getElementById('test-key-result');
this.promptStyleGroup = document.getElementById('prompt-style-group');
```

### IPC Channels Needed

Ensure these are available (from Task 01):
- `OPEN_SETTINGS_TAB` — Switch to settings tab
- `OPEN_HISTORY_TAB` — Switch to history tab  
- `OPEN_USAGE_TAB` — Switch to usage tab

### Main Process Handlers

Ensure IPC handlers exist for:
- `GET_HISTORY` — Returns array of transcription entries
- `CLEAR_HISTORY` — Clears all history
- `GET_USAGE_STATS` — Returns usage statistics

These may already exist in `src/main/ipc.js` — verify and add if missing.

## ✅ Definition of Done

- [ ] HTML containers exist for all three panels (settings, history, usage)
- [ ] History panel displays transcription history with copy/expand functionality
- [ ] Usage panel shows three meters: RPD (requests), Audio Seconds, RPM
- [ ] Tab switching works between Settings/History/Usage
- [ ] History entries show: timestamp, language badge, enhanced badge, preview text
- [ ] History entries can be expanded to show full text
- [ ] History entries can be copied individually
- [ ] "Copy All" button works in History panel
- [ ] "Clear History" button works with confirmation dialog
- [ ] Usage meters update when tab is opened
- [ ] Time until reset is shown in usage panel

## 📁 Expected Artifacts

| File | Action | Description |
|------|--------|-------------|
| `src/renderer/settings-window.html` | Modify | Add panel containers |
| `src/renderer/settings-window.js` | Modify | Initialize panels, handle tab switching |
| `src/main/ipc.js` | Modify/Verify | Ensure history/usage IPC handlers exist |

## 🚫 Constraints

- Do NOT modify the existing panel classes — they work correctly
- Only create the HTML structure they expect
- Ensure CSS classes from existing CSS files work (`history.css`, `usage.css`, `settings.css`)
- Keep tab switching smooth and visually appealing

## Testing Checklist

When testing:
1. Open settings window from tray
2. Verify Settings tab shows API key, language, enhancement options
3. Switch to History tab — should show empty state or existing entries
4. Make a transcription, verify it appears in history
5. Switch to Usage tab — should show three meters
6. Verify meters update after transcription
7. Close and reopen window — should remember last tab or default to Settings

---

*Generated by vibe-orchestrator mode | Session: orch-20260302-021500*
