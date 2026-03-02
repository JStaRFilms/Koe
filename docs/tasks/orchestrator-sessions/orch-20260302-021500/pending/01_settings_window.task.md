# Task 01: Create Settings Window Infrastructure

**Session ID:** orch-20260302-021500  
**Source:** Production Readiness Orchestrator  
**Context:** Part of Phase 1 — Connect disconnected features  
**Priority:** P0 (Critical)  
**Dependencies:** None  
**Created At:** 2026-03-02T02:17:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Required Skills
> **Load these skills before starting work:**
>
> | Skill | Relative Path | Why |
> |-------|---------------|-----|
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | Premium UI for settings window |
> | `ui-ux-pro-max` | `C:/Users/johno/.kilocode/skills/ui-ux-pro-max/SKILL.md` | Color palette, typography guidelines |
>
> **How to load:** Read the SKILL.md file and follow its instructions.

### Check Available Skills
> Before starting, scan all known skills directories for any additional skills that may help with this specific task.

---

## 📋 Objective

Create a SECONDARY window (separate from the pill) that will host:
1. Settings panel (reusing existing `SettingsPanel` class)
2. History panel (reusing existing `HistoryPanel` class)
3. Usage dashboard (reusing existing `UsageMeter` class)

The pill window (400x68px) is too small for these features.

## 🎯 Scope

**In Scope:**
- Create `src/renderer/settings-window.html` — tabbed interface HTML
- Create `src/renderer/settings-window.js` — entry point for settings window
- Create `src/main/settings-window.js` — main process window manager
- Update `src/main/main.js` — integrate settings window creation
- Update `src/main/tray.js` — add menu items for History/Usage/Settings
- Update `src/main/preload.js` — expose APIs for settings window
- Update `src/shared/constants.js` — add new IPC channels
- Create `src/renderer/components/theme-manager.js` — handle dark/light theme

**Out of Scope:**
- Connecting the actual panel logic (Task 02)
- Implementing COULD features (Task 03)
- Security audit (Task 04)

## 📚 Context

### Existing Components to Reuse

1. **HistoryPanel** (`src/renderer/components/history-panel.js`)
   - Expects containers: `history-panel`, `history-content`, `btn-close-history`, `btn-clear-history`, `btn-copy-history`
   - Has methods: `show()`, `hide()`, `loadHistory()`, `renderHistory()`

2. **UsageMeter** (`src/renderer/components/usage-meter.js`)
   - Expects containers: `usage-meter`, `bar-rpd`, `bar-audio`, `bar-rpm`, `text-rpd`, `text-audio`, `text-rpm`, `usage-time-label`
   - Has methods: `show()`, `hide()`, `fetchUsage()`, `updateMeters()`

3. **SettingsPanel** (`src/renderer/components/settings-panel.js`)
   - Expects containers: `settings-panel`, `btn-close-settings`, `btn-save-settings`, `btn-toggle-key`, `btn-test-key`, `api-key`, `language`, `enhance-text`, `prompt-style`, `auto-paste`, `test-key-result`, `prompt-style-group`
   - Has methods: `show()`, `hide()`, `loadSettings()`, `saveSettings()`

### Constants to Add

In `src/shared/constants.js`, add these channels:
```javascript
OPEN_SETTINGS_WINDOW: 'window:open-settings',
OPEN_HISTORY_TAB: 'tab:open-history',
OPEN_USAGE_TAB: 'tab:open-usage',
OPEN_SETTINGS_TAB: 'tab:open-settings'
```

### Window Specifications

**Settings Window:**
- Size: 600x500px
- Frameless: Yes (custom title bar)
- Position: Centered on screen
- Resizable: No
- Always on top: false (let user focus other apps)
- Focusable: true (user needs to interact with settings)

### Tray Menu Updates

Current tray menu:
- Start/Stop Recording
- Settings...
- Quit Koe

New tray menu:
- Start/Stop Recording
- ---
- Settings...
- History...
- Usage...
- ---
- Quit Koe

All three (Settings, History, Usage) open the same window but switch to different tabs.

## ✅ Definition of Done

- [ ] `src/renderer/settings-window.html` created with tabbed interface
- [ ] `src/renderer/settings-window.js` created, initializes all three panels
- [ ] `src/main/settings-window.js` created, manages window lifecycle
- [ ] `src/main/main.js` updated to import and use settings window
- [ ] `src/main/tray.js` updated with History and Usage menu items
- [ ] `src/main/preload.js` updated with settings window APIs
- [ ] `src/shared/constants.js` updated with new IPC channels
- [ ] `src/renderer/components/theme-manager.js` created for theme handling
- [ ] Settings window opens from tray menu
- [ ] Tab switching works (Settings/History/Usage)

## 📁 Expected Artifacts

| File | Purpose |
|------|---------|
| `src/renderer/settings-window.html` | Tabbed settings window HTML |
| `src/renderer/settings-window.js` | Entry point for settings window |
| `src/main/settings-window.js` | Main process window manager |
| `src/renderer/components/theme-manager.js` | Theme switching logic |

## 🚫 Constraints

- ONLY create the infrastructure — don't fully connect panels yet
- Reuse existing CSS files: `main.css`, `settings.css`, `history.css`, `usage.css`
- Keep the existing pill window completely untouched
- Settings window should have a custom title bar (frameless but styled)
- Window should close when clicking X or pressing Escape

## Design Reference

Use the Koe design system from the existing app:
- `--koe-bg-primary`: #0a0a0f
- `--koe-glass-bg`: rgba(15, 15, 25, 0.85)
- `--koe-border`: rgba(255, 255, 255, 0.08)
- `--koe-accent`: #6366f1
- Glassmorphism effects (backdrop-filter)
- JetBrains Mono font family

---

*Generated by vibe-orchestrator mode | Session: orch-20260302-021500*
