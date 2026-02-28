# Task 05: Enhancement + Settings

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| frontend-design | `skills/frontend-design/SKILL.md` | Settings panel UI |
| ui-ux-pro-max | `skills/ui-ux-pro-max/SKILL.md` | Consistent styling |

### Check Additional Skills
> Scan all known skills directories for more relevant skills

---

## Objective
Add Llama text enhancement, the settings panel UI, and auto-paste functionality. This makes Koe go from "transcription tool" to "AI-powered dictation assistant."

## Scope
**Covers FRs:** FR-010 (API Key Settings), FR-011 (AI Enhancement), FR-012 (Language), FR-013 (Auto-Paste)

**Files to Create:**
```
src/main/services/clipboard.js           — Clipboard write + auto-paste simulation
src/main/services/settings.js            — electron-store wrapper (encrypted API key)
src/renderer/components/settings-panel.js — Settings UI component
src/renderer/styles/settings.css         — Settings panel styles
```

**Files to Modify:**
```
package.json             — Add electron-store, @nut-tree/nut-js (optional, for auto-paste)
src/main/services/groq.js — Add Llama enhancement endpoint
src/main/ipc.js          — Add settings + enhancement IPC handlers
src/main/main.js         — Initialize settings service
src/shared/constants.js  — Add settings IPC channels
src/renderer/index.js    — Wire up settings panel toggle
src/renderer/index.html  — Add settings panel markup
```

## Technical Requirements

### Llama Enhancement (`groq.js` addition)
- New method: `enhance(rawText, promptStyle)`
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile` (free tier)
- System prompts by style:
  - **Clean** (default): "Clean this dictated text. Remove filler words, fix punctuation and grammar. Keep original meaning and tone. Return only the cleaned text."
  - **Formal**: "Rewrite this dictated text in a formal, professional tone..."
  - **Casual**: "Clean this up, keep it casual and conversational..."
  - **Bullets**: "Convert this dictated text into concise bullet points..."
- If enhancement fails → fall back to raw text, no crash

### Settings Service (`settings.js`)
- Wrapper around `electron-store` with encryption
- Schema:
  ```
  groqApiKey (encrypted), hotkey, language, enhanceText, autoPaste, theme, promptStyle
  ```
- Methods: `get(key)`, `set(key, value)`, `getAll()`, `validateApiKey()`
- First-launch detection: if no API key, trigger onboarding

### Settings Panel UI
- Slide-in panel from right side (or separate view)
- Sections:
  1. **API Key** — Input (password type), show/hide toggle, "Test Connection" button
  2. **Language** — Dropdown: Auto, English, Spanish, French, German, Portuguese, Japanese, Chinese, Korean, etc.
  3. **Enhancement** — Toggle on/off, prompt style dropdown (Clean/Formal/Casual/Bullets)
  4. **Auto-Paste** — Toggle on/off with warning "experimental"
  5. **Hotkey** — Display current hotkey (Ctrl+Shift+Space), future: customization
- Save button, or auto-save on change
- Match glassmorphism design from floating window

### Auto-Paste (`clipboard.js`)
- `copyToClipboard(text)` — writes to system clipboard
- `autoPaste(text)` — write to clipboard + simulate Ctrl+V
- Use `@nut-tree/nut-js` for key simulation, OR `child_process` with PowerShell `SendKeys`
- This is opt-in (`settings.autoPaste = false` by default)
- Restore focus to previous window before pasting

## Definition of Done
- [ ] Llama enhancement cleans up transcribed text
- [ ] Enhancement toggle works (on/off)
- [ ] Prompt styles change Llama behavior
- [ ] Settings panel opens/closes smoothly
- [ ] API key saved encrypted, test connection works
- [ ] Language selection persists and is sent to Whisper
- [ ] Auto-paste works when enabled (text pasted in previous app)
- [ ] Auto-paste off by default, labeled "experimental"
- [ ] Settings persist across restarts
- [ ] First-launch shows onboarding prompt for API key
- [ ] Enhancement failure gracefully falls back to raw text

## Constraints
- API key NEVER leaves main process or gets logged
- All API calls in main process only
- Settings panel matches existing floating window design
- Auto-paste is optional — clipboard copy must always work without it
