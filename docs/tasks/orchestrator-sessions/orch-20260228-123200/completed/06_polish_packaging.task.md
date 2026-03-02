# Task 06: Polish + Packaging

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| frontend-design | `skills/frontend-design/SKILL.md` | History/usage UI |
| ui-ux-pro-max | `skills/ui-ux-pro-max/SKILL.md` | Consistent styling |

### Check Additional Skills
> Scan all known skills directories for more relevant skills

---

## Objective
Add history panel, usage meter, and package the app with electron-builder for Windows distribution.

## Scope
**Covers FRs:** FR-014 (History Panel), FR-015 (Usage Dashboard), + packaging

**Files to Create:**
```
src/renderer/components/history-panel.js  — Transcription history list
src/renderer/components/usage-meter.js    — API usage display
src/renderer/styles/history.css           — History panel styles
src/renderer/styles/usage.css             — Usage meter styles
```

**Files to Modify:**
```
electron-builder.yml      — Finalize packaging config
package.json              — Add build scripts
src/main/ipc.js           — History + usage IPC handlers
src/renderer/index.html   — Add history/usage panel markup
src/renderer/index.js     — Wire up panels
src/renderer/styles/main.css — Add panel transition styles
```

## Technical Requirements

### History Panel
- Scrollable list of recent transcriptions (max 100 in electron-store)
- Each entry: timestamp, language badge, text preview (truncated to 80 chars)
- Click to expand full text (raw + enhanced if available)
- Copy button per entry
- "Clear History" with confirmation dialog
- Newest first (reverse chronological)
- Access via tab/button in floating window or tray menu

### Usage Meter
- Progress bars for:
  - Requests today: X / 2,000 RPD
  - Audio seconds today: X / 28,800
  - Requests this minute: X / 20 RPM (real-time)
- Color coding: green (0-50%), yellow (50-80%), red (80-100%)
- "Resets at midnight" label with local time
- Compact display in floating window footer, expandable for details
- Auto-updates after each transcription

### Packaging (electron-builder)
- Target: Windows NSIS installer
- App name: "Koe"
- Icons: app icon (256x256), installer icon
- Include: Silero VAD ONNX model, tray icons
- Exclude: dev dependencies, source maps
- Auto-update: skip for V1 (COULD feature)
- Output: `dist/` folder with `.exe` installer

## Definition of Done
- [ ] History panel shows past transcriptions
- [ ] History entries are expandable, copyable
- [ ] History persists across restarts (electron-store)
- [ ] History capped at 100 entries (FIFO)
- [ ] Clear history with confirmation
- [ ] Usage meter shows RPD, audio seconds, RPM
- [ ] Usage bars color-coded (green/yellow/red)
- [ ] Usage updates in real-time
- [ ] `npm run build` produces Windows installer
- [ ] Packaged app runs without errors
- [ ] All features work in packaged build (tray, hotkey, transcription)
- [ ] Silero VAD model bundled correctly in package

## Constraints
- History stored in electron-store (no external DB)
- Usage stats from rate-limiter service (already built in Task 03)
- Packaging must include all ONNX model files
- Test packaged app on clean Windows (no dev tools installed)
