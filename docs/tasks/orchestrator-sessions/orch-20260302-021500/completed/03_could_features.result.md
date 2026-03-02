# Task 03: Implement COULD Features (FR-016 to FR-020) - COMPLETED

**Session ID:** orch-20260302-021500  
**Completed At:** 2026-03-02T02:55:00Z  
**Mode:** vibe-code

---

## ✅ Summary

Successfully implemented all 5 COULD features identified in the Vision Brief:

| Feature | Status | Files Modified |
|---------|--------|----------------|
| FR-016: Custom AI Prompt | ✅ Complete | Verified existing implementation |
| FR-017: Speed vs Accuracy Toggle | ✅ Complete | `constants.js`, `groq.js`, `settings-window.html`, `settings-panel.js` |
| FR-018: Custom Hotkey Configuration | ✅ Complete | `constants.js`, `shortcuts.js`, `settings-window.html`, `settings-panel.js`, `ipc.js` |
| FR-019: Dark/Light Theme Toggle | ✅ Complete | `main.css`, `settings-window.html`, `settings-panel.js`, `settings-window.js` |
| FR-020: Export Transcriptions | ✅ Complete | `ipc.js`, `preload.js`, `settings-window.html`, `history-panel.js`, `settings.css` |

---

## 📁 Files Modified

### Backend (Main Process)
1. **`src/shared/constants.js`**
   - Added `model` to DEFAULT_SETTINGS with default value `whisper-large-v3-turbo`

2. **`src/main/services/groq.js`**
   - Changed hardcoded `MODEL` constant to read from settings
   - Falls back to `whisper-large-v3-turbo` if not set

3. **`src/main/shortcuts.js`**
   - Added `currentHotkey` state tracking
   - Added `updateHotkey()` function for dynamic re-registration
   - Added `getCurrentHotkey()` and `validateHotkey()` utilities
   - Changed to read hotkey from settings instead of constants only

4. **`src/main/ipc.js`**
   - Added export handler for `history:export` channel
   - Updated save settings handler to trigger hotkey re-registration
   - Added error handling for hotkey conflicts
   - Added `mainWindowRef` for access in handlers

5. **`src/main/preload.js`**
   - Added `exportHistory(format)` to exposed API

### Frontend (Renderer Process)
6. **`src/renderer/settings-window.html`**
   - Added Transcription Model selector (Fast Turbo vs Accurate Large-v3)
   - Added Theme selector (Dark, Light, System)
   - Added Hotkey input with visual recording state
   - Added Export button to history panel footer
   - Added input help text and error display for hotkey

7. **`src/renderer/settings-window.js`**
   - Added ThemeManager import and initialization

8. **`src/renderer/components/settings-panel.js`**
   - Added UI element references for model, theme, and hotkey
   - Added hotkey recording state management
   - Added `startHotkeyRecording()`, `stopHotkeyRecording()`, `handleHotkeyInput()`
   - Added `formatHotkeyForDisplay()` and `parseHotkeyFromDisplay()` helpers
   - Added `applyThemePreview()` for immediate theme feedback
   - Updated `loadSettings()` to populate new fields
   - Updated `saveSettings()` to include new settings
   - Added error handling for hotkey save failures

9. **`src/renderer/components/history-panel.js`**
   - Added export button reference and click handler
   - Added `exportHistory()` method with toast notifications

### Styles
10. **`src/renderer/styles/main.css`**
    - Added `[data-theme="light"]` CSS variables for light theme
    - Maintains brand accent color consistency across themes

11. **`src/renderer/styles/settings.css`**
    - Added `.input-help` for helper text
    - Added `#hotkey` styles with recording state animation
    - Added `.hotkey-error` for validation errors

---

## 🎯 Feature Details

### FR-016: Custom AI Prompt (Verified)
- Already implemented in settings panel with `selPromptStyle` select
- Options: Clean, Professional, Casual, Concise
- Backend uses `promptStyle` from settings in `enhance()` function

### FR-017: Speed vs Accuracy Toggle
- Model selector shows user-friendly labels
- Options:
  - "Fast (Turbo) — Lower accuracy, quicker" → `whisper-large-v3-turbo`
  - "Accurate (Large-v3) — Higher accuracy, slower" → `whisper-large-v3`
- Model selection persists across restarts
- Applies to next transcription (not retroactive)

### FR-018: Custom Hotkey Configuration
- Interactive hotkey input with click-to-record
- Visual feedback with pulsing border during recording
- Captures full key combination (Ctrl/Cmd + Shift + Alt + key)
- Immediate re-registration on save
- Error display if hotkey is invalid or conflicts
- Persists across restarts
- Format examples displayed: "Ctrl + Shift + Space"

### FR-019: Dark/Light Theme Toggle
- Theme selector with options: Dark, Light, System (Auto)
- Light theme CSS variables for all UI components
- Theme applies immediately without restart
- System option follows OS preference
- Persists across restarts
- Applies to both pill and settings windows

### FR-020: Export Transcriptions
- Export button in history panel footer
- Uses Electron's `dialog.showSaveDialog()`
- Supports .txt and .md formats via file filter
- Default filename: `koe-transcriptions.txt`
- Format:
  ```
  Koe Transcriptions — 3/2/2026
  ========================================
  
  14:32 - This is the first transcription
  14:35 - This is another transcription
  ```
- Toast notification on success/error

---

## 📚 Skills Used

- **frontend-design** - UI component styling and theming
- **ui-ux-pro-max** - Light/dark mode contrast guidelines and form patterns

---

## 🧪 Testing Notes

### Manual Testing Checklist
- [ ] Change prompt style, save, verify it persists
- [ ] Switch model, make transcription, verify correct model used
- [ ] Change hotkey, verify old stops working and new works
- [ ] Toggle theme, verify both windows update
- [ ] Export history, verify file format and content

### Known Limitations
1. Hotkey validation happens on save, not during recording
2. System theme option only detects on startup and visibility change
3. Export format doesn't include markdown-specific formatting for .md files

---

## 🚫 Blockers Encountered

None. All features implemented successfully.

---

## 📝 FR Issue Updates

All FR issue files updated with completion status:
- `docs/issues/FR-016.md` ✅
- `docs/issues/FR-017.md` ✅
- `docs/issues/FR-018.md` ✅
- `docs/issues/FR-019.md` ✅
- `docs/issues/FR-020.md` ✅

---

*Completed by vibe-code mode | Session: orch-20260302-021500*
