# Vision Brief — Koe (声)

> **Koe** (声) — Japanese for "voice." A free, open-source WhisperFlow alternative. Real-time voice dictation → AI-enhanced text → paste anywhere.

---

## 1. The Idea

| | |
|---|---|
| **One-liner** | Koe: press a hotkey, talk, get polished text pasted wherever your cursor is |
| **Problem** | WhisperFlow costs $8-10/mo. Voice dictation shouldn't need a subscription when the APIs are free |
| **Target User** | You first. Then anyone who wants fast voice-to-text without a subscription |
| **Unique Angle** | Zero cost via Groq free tier (28,800 audio sec/day ≈ 8 hrs). Future SaaS potential |

---

## 2. Research Findings

### Competitors

| Tool | Cost | Approach | Weakness |
|---|---|---|---|
| WhisperFlow | $8+/mo | Cloud Whisper + Gemini cleanup | Subscription |
| RealtimeSTT | Free/OSS | Local Whisper (GPU required) | Needs beefy GPU, no AI cleanup |
| Handy | Free/OSS | Local Whisper offline | Heavy, no AI enhancement |
| Built-in dictation (Win/Mac) | Free | OS-level | Terrible accuracy, no formatting |

### Groq Free Tier Limits

| Model | RPM | RPD | Audio Sec/Hr | Audio Sec/Day |
|---|---|---|---|---|
| `whisper-large-v3` | 20 | 2,000 | 7,200 | 28,800 |
| `whisper-large-v3-turbo` | 20 | 2,000 | 7,200 | 28,800 |

**Also free:** Groq Llama models for text cleanup/formatting (generous limits).

### Technical Feasibility ✅

- Groq's Whisper API is OpenAI-compatible, well-documented
- `whisper-large-v3-turbo` runs at **216x realtime** — virtually instant
- Electron supports Web Audio API, global shortcuts, system tray, clipboard
- VAD libraries exist for browser (`@ricky0123/vad-web` using Silero VAD)
- 20 RPM with ~3-5s audio chunks maps perfectly to natural speech patterns

---

## 3. Architecture Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| **Platform** | Electron desktop app | Core value = system-level hotkey + paste-anywhere. Web app can't do this |
| **Renderer** | Vite + Vanilla JS/CSS | Small UI surface (floating window + settings). No framework overhead needed |
| **Audio Capture** | Web Audio API + AudioWorklet | Native to Electron's Chromium. Low latency, full control |
| **VAD** | `@ricky0123/vad-web` (Silero) | Battle-tested, works in browser contexts, handles speech/silence detection |
| **STT API** | Groq Whisper (`whisper-large-v3-turbo`) | Free, fast (216x RT), OpenAI-compatible |
| **AI Enhancement** | Groq Llama 3 (free tier) | Clean filler words, add punctuation, format text. The "Flow" in Koe |
| **System Integration** | Electron clipboard + `robotjs`/`nut-js` | Copy text → simulate Ctrl+V in previously-focused window |
| **Packaging** | electron-builder | Cross-platform builds, auto-update support |

### Architecture Diagram

```
┌──────────────────────────────────────────┐
│            ELECTRON MAIN PROCESS         │
│                                          │
│  ┌──────────┐  ┌───────────────────┐     │
│  │ System   │  │ Global Shortcuts  │     │
│  │ Tray     │  │ (Ctrl+Shift+Space)│     │
│  └──────────┘  └───────────────────┘     │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Groq Service                     │    │
│  │ ├─ Whisper STT (audio → text)    │    │
│  │ ├─ Llama LLM (text → clean text) │    │
│  │ └─ Rate Limiter (20 RPM / 2K RPD)│    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Clipboard + Auto-Paste Service   │    │
│  └──────────────────────────────────┘    │
└────────────────┬─────────────────────────┘
                 │ IPC
┌────────────────┴─────────────────────────┐
│          ELECTRON RENDERER               │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Floating Transcription Window    │    │
│  │ (always-on-top, draggable,       │    │
│  │  compact, glassmorphism UI)      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Audio Pipeline (Renderer)        │    │
│  │ ├─ getUserMedia (mic access)     │    │
│  │ ├─ AudioWorklet (processing)     │    │
│  │ ├─ Silero VAD (speech detection) │    │
│  │ └─ WAV encoder (chunk → file)    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Settings Panel (API key, hotkey, │    │
│  │  language, enhancement toggle)   │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### Data Flow

```
Hotkey → Start Mic → VAD detects speech → Buffer audio
  → Speech ends → Encode WAV → IPC to main
  → Groq Whisper API → Raw text
  → (optional) Groq Llama → Cleaned text
  → Display in floating window
  → Copy to clipboard / auto-paste
```

---

## 4. Feature Scope (MoSCoW)

### MUST Have (MVP)

| # | Feature | Acceptance Criteria |
|---|---|---|
| FR-1 | **Global Hotkey Toggle** | Press Ctrl+Shift+Space to start/stop recording. Visual indicator shows recording state |
| FR-2 | **Mic Audio Capture** | Capture audio from default mic using Web Audio API. Support common sample rates (16kHz for Whisper) |
| FR-3 | **Voice Activity Detection** | Silero VAD detects speech segments. Only transcribe when speech detected. Auto-stop after silence |
| FR-4 | **Audio Chunking** | Buffer speech into ~3-5 second chunks. Encode as WAV. Respect 25MB file limit |
| FR-5 | **Groq Whisper Transcription** | Send audio chunks to Groq API. Get text back. Handle errors gracefully |
| FR-6 | **Rate Limiting** | Enforce 20 RPM / 2K RPD. Queue overflow chunks. Show usage in UI |
| FR-7 | **Floating Transcription Window** | Always-on-top, compact, glassmorphism UI. Shows live text as it arrives. Draggable |
| FR-8 | **Clipboard Integration** | Auto-copy completed transcription to clipboard. Toast notification on copy |
| FR-9 | **System Tray** | Tray icon with right-click menu: Start/Stop, Settings, Quit |
| FR-10 | **Settings: API Key** | Input field for Groq API key. Stored securely in electron-store |

### SHOULD Have

| # | Feature | Description |
|---|---|---|
| FR-11 | **AI Text Enhancement** | Send raw transcription through Groq Llama for cleanup (filler words, punctuation, grammar) |
| FR-12 | **Language Selection** | Dropdown to select transcription language (default: auto-detect) |
| FR-13 | **Auto-Paste** | Simulate Ctrl+V in previously-focused window after transcription |
| FR-14 | **History Panel** | Scrollable list of recent transcriptions with copy-again button |
| FR-15 | **Usage Dashboard** | Show daily audio seconds used, requests remaining, visual meter |

### COULD Have

| # | Feature | Description |
|---|---|---|
| FR-16 | Custom AI prompt for text style (formal, casual, bullet points) |
| FR-17 | Speed vs. Accuracy mode toggle (turbo vs. large-v3) |
| FR-18 | Keyboard shortcut customization |
| FR-19 | Dark/Light theme toggle |
| FR-20 | Export transcriptions as .txt/.md |

### WON'T (V1)

- Mobile app
- Team/collaboration features
- Whisper mode (quiet dictation)
- Voice commands for editing
- Offline/local Whisper fallback

---

## 5. Monetization Strategy

**V1: Free / BYOK (Bring Your Own Key)**
- Open-source on GitHub
- Users bring their own Groq API key (free)
- Zero infrastructure cost on your end

**Future SaaS Potential (V2+):**
- Managed API keys (you pay for Groq, charge users)
- Tiered plans mirroring WhisperFlow's model
- Premium features: snippet library, tones, team sync
- Freemium: free tier with usage cap, paid for unlimited

---

## 5b. Future Roadmap (Post-MVP, SaaS Features)

*Sourced from WhisperFlow's pricing tiers — features to consider for V2+:*

### Starter Tier Features
- [ ] AI-powered voice dictation (✅ MVP covers this)
- [ ] Automatic speech recognition (✅ MVP)
- [ ] Works in every app (✅ MVP via auto-paste)
- [ ] AI auto-edits & filler word removal (✅ MVP via Llama)
- [ ] Remove speech habits automatically
- [ ] Personal dictionary
- [ ] 100+ languages support
- [ ] Cross-platform (Windows, Mac, iPhone)

### Standard Tier Features
- [ ] Snippet library with voice shortcuts
- [ ] Different tones for each app (formal email vs casual chat)
- [ ] Advanced AI auto-edits & filler word removal
- [ ] Enhanced speech habit removal
- [ ] Sync across all devices
- [ ] Community access (Discord)

### Enterprise Tier Features
- [ ] Team collaboration features
- [ ] Advanced analytics
- [ ] Custom voice commands
- [ ] HIPAA-ready compliance
- [ ] Dedicated account manager
- [ ] Custom integrations

---

## 6. Execution Strategy

### Workflow Chain

```
/vibe-genesis (scaffold project)
  → /mode-code (implement features iteratively)
    → /mode-review (quality check)
      → /vibe-finalize (package + ship)
```

### Skills to Inject

| Skill | Purpose |
|---|---|
| `frontend-design` | Premium UI for the floating window |
| `ui-ux-pro-max` | Color palette, typography, micro-animations |
| `context7` | Electron API docs, Vite config docs |
| `webapp-testing` | Verify the Electron app with Playwright |

### Build Order

1. **Phase 1 — Skeleton**: Electron + Vite scaffold, system tray, global hotkey
2. **Phase 2 — Audio Pipeline**: Mic capture → VAD → chunking → WAV encoding
3. **Phase 3 — Groq Integration**: Whisper API calls, rate limiter, error handling
4. **Phase 4 — UI**: Floating window, live text display, glassmorphism design
5. **Phase 5 — Enhancement**: Llama text cleanup, settings panel, clipboard
6. **Phase 6 — Polish**: History, usage meter, packaging

---

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Groq changes free tier limits | High | Low | Abstract API layer; can swap to local Whisper or another provider |
| Rate limiting causes gaps in transcription | Medium | Medium | Smart buffering queue; merge adjacent chunks; show "processing" indicator |
| Electron app is too heavy (~150MB) | Low | Certain | Acceptable for personal tool. No lighter alternative has these capabilities |
| `robotjs`/`nut-js` auto-paste breaks on some apps | Medium | Medium | V1 defaults to clipboard-only. Auto-paste is opt-in SHOULD feature |
| VAD misses speech or triggers on noise | Medium | Low | Silero VAD is robust. Add sensitivity slider in settings |

---

## 8. Data Model

Minimal — local-only storage via `electron-store`:

```
Settings {
  groqApiKey: string (encrypted)
  hotkey: string (default: "Ctrl+Shift+Space")
  language: string (default: "auto")
  enhanceText: boolean (default: true)
  autoPaste: boolean (default: false)
  theme: "dark" | "light"
}

TranscriptionEntry {
  id: string (uuid)
  timestamp: Date
  rawText: string
  enhancedText: string | null
  audioLengthSeconds: number
  language: string
}

UsageStats {
  date: string (YYYY-MM-DD)
  requestCount: number
  audioSecondsUsed: number
}
```

---

## Orchestrator Handoff

When approved, the Orchestrator should:

1. Run `/vibe-genesis` with this Vision Brief as context
2. Scaffold an Electron + Vite project in the workspace
3. Implement features in the Build Order (Phase 1 → 6)
4. Inject `frontend-design`, `ui-ux-pro-max`, `context7` skills during UI phases
5. Run `/mode-review` after each phase
6. Package with `electron-builder` for Windows
