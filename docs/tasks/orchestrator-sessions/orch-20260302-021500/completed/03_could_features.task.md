# Task 03: Implement COULD Features (FR-016 to FR-020)

**Session ID:** orch-20260302-021500  
**Source:** Production Readiness Orchestrator  
**Context:** Part of Phase 3 — Complete remaining COULD features  
**Priority:** P1 (High)  
**Dependencies:** Task 01, Task 02  
**Created At:** 2026-03-02T02:19:00Z

---

## 🔧 Agent Setup (DO THIS FIRST)

### Required Skills
> **Load these skills before starting work:**
>
> | Skill | Relative Path | Why |
> |-------|---------------|-----|
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | UI for new settings |
> | `ui-ux-pro-max` | `C:/Users/johno/.kilocode/skills/ui-ux-pro-max/SKILL.md` | Consistent design |
>
> **How to load:** Read the SKILL.md file and follow its instructions.

---

## 📋 Objective

Implement all remaining COULD features from the Vision Brief:
- FR-016: Custom AI Prompt (verify it's working)
- FR-017: Speed vs Accuracy Toggle (model selection)
- FR-018: Custom Hotkey Configuration
- FR-019: Dark/Light Theme Toggle
- FR-020: Export Transcriptions

## 🎯 Scope

**In Scope:**

### FR-016: Custom AI Prompt (Verify)
- The Settings panel already has `selPromptStyle` 
- Verify it's properly connected in the backend
- Options: Clean, Formal, Casual, Bullets
- Backend uses `promptStyle` from settings

### FR-017: Speed vs Accuracy Toggle
- Add model selector to Settings panel
- Options: `whisper-large-v3-turbo` (fast) vs `whisper-large-v3` (accurate)
- Update `src/main/services/groq.js` to accept model parameter
- Store preference in electron-store
- Default: `whisper-large-v3-turbo`

### FR-018: Custom Hotkey Configuration
- Add hotkey input field to Settings panel
- Update `src/main/shortcuts.js` to:
  - Unregister old hotkey when saving new one
  - Register new hotkey
  - Validate hotkey format (Electron accelerator format)
- Store in electron-store
- Update default in `src/shared/constants.js`

### FR-019: Dark/Light Theme Toggle
- Add theme selector to Settings panel
- Create `src/renderer/components/theme-manager.js` (if not created in Task 01)
- CSS variables for theming (already using `--koe-*` tokens)
- Persist theme choice in electron-store
- Apply to both pill and settings windows
- Default: dark (current)

### FR-020: Export Transcriptions
- Add "Export" button to History panel
- Export formats: `.txt` or `.md`
- Use Electron's `dialog.showSaveDialog`
- Format: `HH:MM - [transcription text]` for each entry
- Include date header

**Out of Scope:**
- Creating settings window (Task 01)
- Connecting panels (Task 02)
- Security audit (Task 04)

## 📚 Context

### FR-017: Model Selection

Current hardcoded model in `src/main/services/groq.js`:
```javascript
const MODEL = 'whisper-large-v3-turbo';
```

Change to accept model from settings:
```javascript
const model = settings.model || 'whisper-large-v3-turbo';
```

Available models:
- `whisper-large-v3-turbo` — Faster, slightly less accurate
- `whisper-large-v3` — More accurate, slower

### FR-018: Hotkey Configuration

Current hotkey registration in `src/main/shortcuts.js`:
```javascript
function registerShortcuts(mainWindow) {
    const ret = globalShortcut.register('CommandOrControl+Shift+Space', () => {
        // toggle recording
    });
}
```

Need to:
1. Read hotkey from settings
2. Unregister old hotkey before registering new one
3. Validate format using Electron's `globalShortcut`
4. Show error if hotkey is invalid or already in use

Hotkey format examples:
- `CommandOrControl+Shift+Space`
- `Alt+Shift+R`
- `Ctrl+F12`

### FR-019: Theme Toggle

Current CSS uses dark theme variables in `src/renderer/styles/main.css`:
```css
:root {
  --koe-bg-primary: #0a0a0f;
  --koe-glass-bg: rgba(15, 15, 25, 0.85);
  /* ... */
}
```

Light theme variables needed:
```css
[data-theme="light"] {
  --koe-bg-primary: #f5f5f7;
  --koe-glass-bg: rgba(255, 255, 255, 0.85);
  /* ... */
}
```

Theme manager should:
1. Read theme from settings on startup
2. Apply to document.documentElement
3. Listen for settings changes
4. Sync across both windows (pill and settings)

### FR-020: Export Format

Export dialog options:
```javascript
const { filePath } = await dialog.showSaveDialog({
    filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown Files', extensions: ['md'] }
    ],
    defaultPath: 'koe-transcriptions.txt'
});
```

Export format:
```
Koe Transcriptions — 2026-03-02
================================

14:32 - This is the first transcription text
14:35 - This is another transcription with more content
14:40 - A third transcription entry
```

## ✅ Definition of Done

### FR-016: Custom AI Prompt
- [ ] Verify `selPromptStyle` in Settings panel is populated with options
- [ ] Verify selection is saved to settings
- [ ] Verify backend receives `promptStyle` parameter
- [ ] Options: Clean, Formal, Casual, Bullets

### FR-017: Speed vs Accuracy
- [ ] Model selector added to Settings panel
- [ ] Options: "Fast (Turbo)" and "Accurate (Large-v3)"
- [ ] Selection persists in electron-store
- [ ] `groq.js` uses selected model for transcription
- [ ] Default remains "Fast"

### FR-018: Custom Hotkey
- [ ] Hotkey input field added to Settings panel
- [ ] Current hotkey is displayed
- [ ] Saving new hotkey unregisters old and registers new
- [ ] Invalid hotkey shows error message
- [ ] Hotkey works after app restart
- [ ] Hotkey persists in electron-store

### FR-019: Theme Toggle
- [ ] Theme selector added to Settings panel
- [ ] Options: "Dark" and "Light"
- [ ] CSS variables switch based on theme
- [ ] Theme applies to pill window immediately
- [ ] Theme applies to settings window immediately
- [ ] Theme persists in electron-store
- [ ] Default remains "Dark"

### FR-020: Export Transcriptions
- [ ] "Export" button added to History panel
- [ ] Clicking opens save dialog with .txt and .md options
- [ ] File is saved with proper formatting
- [ ] Format includes timestamp and text for each entry
- [ ] Success toast shown after export

## 📁 Expected Artifacts

| File | Action | Description |
|------|--------|-------------|
| `src/main/services/groq.js` | Modify | Accept model parameter |
| `src/main/shortcuts.js` | Modify | Support dynamic hotkey |
| `src/main/services/settings.js` | Modify | Add new setting keys |
| `src/shared/constants.js` | Modify | Update DEFAULT_SETTINGS |
| `src/renderer/components/settings-panel.js` | Modify | Add new UI controls |
| `src/renderer/components/history-panel.js` | Modify | Add export button |
| `src/renderer/components/theme-manager.js` | Create/Modify | Handle theme switching |
| `src/renderer/styles/main.css` | Modify | Add light theme variables |
| `src/main/ipc.js` | Modify | Add export handler |
| `src/main/preload.js` | Modify | Expose export API |

## 🚫 Constraints

- All features must work after app restart
- Invalid hotkeys must show user-friendly error
- Theme change should be immediate (no restart needed)
- Export should handle empty history gracefully
- Model change applies to next transcription (not retroactive)

## Testing Checklist

1. **FR-016:** Change prompt style, save, verify it persists
2. **FR-017:** Switch model, make transcription, verify correct model used
3. **FR-018:** Change hotkey, verify old stops working and new works
4. **FR-019:** Toggle theme, verify both windows update
5. **FR-020:** Export history, verify file format and content

---

*Generated by vibe-orchestrator mode | Session: orch-20260302-021500*
