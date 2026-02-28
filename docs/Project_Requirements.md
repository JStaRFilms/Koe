# Project Requirements Document

## Project Overview

**Name:** Koe (声)
**Mission:** Free, open-source voice dictation app — press a hotkey, talk, get AI-polished text pasted wherever your cursor is.
**Tech Stack:** Electron, Vite, Vanilla JS + CSS, @ricky0123/vad-web (Silero VAD), Groq API (Whisper + Llama), electron-store, electron-builder

## Architecture

- **Main Process:** System tray, global shortcuts, Groq API service, clipboard/paste service, settings (electron-store)
- **Renderer Process:** Floating transcription window, audio pipeline (Web Audio API → AudioWorklet → Silero VAD → WAV encoder), settings panel
- **IPC Bridge:** Audio chunks (renderer → main), transcription results (main → renderer), settings sync

## Functional Requirements

| FR ID | Description | User Story | Status |
|:---|:---|:---|:---|
| FR-001 | Global Hotkey Toggle | As a user, I want to press Ctrl+Shift+Space to start/stop recording, so I can dictate hands-free | MUS |
| FR-002 | Mic Audio Capture | As a user, I want my mic audio captured at 16kHz, so Whisper gets optimal input | MUS |
| FR-003 | Voice Activity Detection | As a user, I want VAD to detect when I'm speaking and when I stop, so only speech is transcribed | MUS |
| FR-004 | Audio Chunking | As a user, I want speech buffered into ~3-5s WAV chunks, so they fit Groq's rate limits naturally | MUS |
| FR-005 | Groq Whisper Transcription | As a user, I want audio sent to Groq Whisper and text returned, so I get accurate transcriptions | MUS |
| FR-006 | Rate Limiting | As a user, I want the app to respect Groq's 20 RPM / 2K RPD limits, so my API key isn't banned | MUS |
| FR-007 | Floating Transcription Window | As a user, I want a compact, always-on-top window showing live text, so I can see what's being transcribed | MUS |
| FR-008 | Clipboard Integration | As a user, I want completed text auto-copied to clipboard, so I can paste it anywhere | MUS |
| FR-009 | System Tray | As a user, I want a tray icon with Start/Stop, Settings, Quit options, so the app doesn't clutter my taskbar | MUS |
| FR-010 | Settings: API Key | As a user, I want to enter my Groq API key securely, so the app can call the API | MUS |
| FR-011 | AI Text Enhancement | As a user, I want raw text cleaned by Llama (filler words, punctuation, grammar), so my dictation sounds polished | SHOULD |
| FR-012 | Language Selection | As a user, I want to choose my transcription language, so I can dictate in different languages | SHOULD |
| FR-013 | Auto-Paste | As a user, I want text auto-pasted into my previously-focused app, so I don't have to Ctrl+V manually | SHOULD |
| FR-014 | History Panel | As a user, I want a list of recent transcriptions with copy-again, so I can re-use past dictations | SHOULD |
| FR-015 | Usage Dashboard | As a user, I want to see daily audio seconds used and requests remaining, so I know my limits | SHOULD |
| FR-016 | Custom AI Prompt | As a user, I want different text styles (formal, casual, bullet points), so dictation fits my context | COULD |
| FR-017 | Speed vs. Accuracy Toggle | As a user, I want to choose turbo vs. large-v3 model, so I can trade speed for accuracy | COULD |
| FR-018 | Custom Hotkey | As a user, I want to change the hotkey, so it doesn't conflict with my other shortcuts | COULD |
| FR-019 | Dark/Light Theme | As a user, I want to toggle themes, so the UI fits my desktop aesthetic | COULD |
| FR-020 | Export Transcriptions | As a user, I want to export history as .txt/.md, so I can save my dictations | COULD |

## Data Model

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

## Build Order

1. **Phase 1 — Skeleton:** Electron + Vite scaffold, system tray, global hotkey
2. **Phase 2 — Audio Pipeline:** Mic capture → VAD → chunking → WAV encoding
3. **Phase 3 — Groq Integration:** Whisper API calls, rate limiter, error handling
4. **Phase 4 — UI:** Floating window, live text, glassmorphism
5. **Phase 5 — Enhancement:** Llama cleanup, settings panel, clipboard
6. **Phase 6 — Polish:** History, usage meter, packaging
