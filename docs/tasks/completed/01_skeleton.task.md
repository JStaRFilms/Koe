# Task 01: Electron + Vite Skeleton

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| — | — | No special skills for scaffold |

### Check Additional Skills
> Scan all known skills directories for more relevant skills

---

## Objective
Scaffold the Electron + Vite project from scratch. Create the main process, renderer process, preload bridge, system tray, global hotkey, and IPC foundation.

## Scope
**Covers FRs:** FR-001 (Global Hotkey), FR-009 (System Tray) — skeleton only

**Files to Create:**
```
package.json
vite.config.js
electron-builder.yml
src/main/main.js           — App lifecycle, window creation
src/main/tray.js           — System tray + context menu
src/main/shortcuts.js      — Global hotkey (Ctrl+Shift+Space)
src/main/ipc.js            — IPC handler hub
src/main/preload.js        — Context bridge
src/renderer/index.html    — HTML shell
src/renderer/index.js      — Renderer entry
src/renderer/styles/main.css — Design tokens + base reset
src/shared/constants.js    — IPC channels, defaults
src/assets/icons/           — Tray icons (generate placeholder)
```

## Context
- Vision Brief: `docs/Vision_Brief.md`
- Coding Guidelines: `docs/Coding_Guidelines.md`
- Builder Prompt: `docs/Builder_Prompt.md`
- Architecture diagram in Vision Brief §3

## Technical Requirements

### Electron Main Process
- `BrowserWindow`: `frame: false`, `transparent: true`, `alwaysOnTop: true`, `width: 420`, `height: 220`
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
- Load Vite dev server in dev mode (`http://localhost:5173`), built HTML in prod
- Hide window on close (minimize to tray), quit from tray only

### Vite Config
- Input: `src/renderer/index.html`
- Output: `dist/renderer`
- Dev server on port 5173

### System Tray
- Create Tray with 16x16 icon
- Context menu: "Start Recording" / "Stop Recording" (toggles), separator, "Settings", "Quit"
- Left-click: show/focus floating window
- Tooltip: "Koe — Idle" / "Koe — Recording"

### Global Hotkey
- Register `CommandOrControl+Shift+Space` on app ready
- Toggle recording state, send IPC to renderer
- Unregister on app quit

### IPC Bridge
- Define channels in `src/shared/constants.js`
- Preload exposes: `onRecordingToggle(callback)`, `getSettings()`, `saveSettings(data)`

### CSS Foundation
- Dark theme tokens: `--koe-bg`, `--koe-surface`, `--koe-text`, `--koe-accent`, `--koe-danger`
- Glassmorphism base: `backdrop-filter: blur(20px)`, `background: rgba()`
- Font: Inter or system font stack
- Draggable title bar region

## Definition of Done
- [ ] `npm install` completes without errors
- [ ] `npm run dev` opens an Electron window
- [ ] Window is frameless, transparent, always-on-top
- [ ] System tray icon visible with working context menu
- [ ] Ctrl+Shift+Space triggers recording toggle (console log confirms)
- [ ] IPC bridge connects main ↔ renderer (verified via console)
- [ ] Window stays in tray when closed (app doesn't quit)
- [ ] Tray "Quit" exits app cleanly
- [ ] Global shortcut unregistered on quit (no orphaned bindings)

## Expected Artifacts
- All files listed in Scope above
- `node_modules/` installed
- App runs in dev mode without crashes

## Constraints
- **No React/Vue** — Vanilla JS only
- **No TypeScript** — Plain JS with JSDoc
- **Electron security** — context isolation ON, no node integration in renderer
- Don't implement audio, API calls, or settings UI yet — skeleton only
