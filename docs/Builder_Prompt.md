# Builder Prompt — Koe (声)

## Stack-Specific Instructions

### Electron + Vite Setup
- Use `electron-vite` or manual Vite config for renderer bundling
- Main process runs Node.js — can use `fs`, `path`, `child_process`
- Renderer is a Chromium web page — use Web APIs only (+ preload bridge)
- Preload script bridges main ↔ renderer via `contextBridge`

### Audio Pipeline
- `navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } })` for mic
- Use `AudioWorkletNode` for real-time audio processing (NOT ScriptProcessorNode)
- `@ricky0123/vad-web` for Silero VAD — install via npm, load ONNX model
- WAV encoding: PCM 16-bit, 16kHz, mono — Groq Whisper wants this format

### Groq API
- Base URL: `https://api.groq.com/openai/v1/audio/transcriptions`
- Model: `whisper-large-v3-turbo`
- Send as `multipart/form-data` with `file` (WAV blob) and `model` fields
- Response: `{ text: "transcribed text" }`
- For Llama enhancement: use chat completions endpoint with system prompt

### Rate Limiting (CRITICAL)
- **20 requests per minute** — Use sliding window counter
- **2,000 requests per day** — Track in electron-store, reset at midnight
- **28,800 audio seconds per day** — Track cumulative audio length
- Queue overflow: hold chunks in memory, process when slot opens
- Show user their remaining quota

### System Integration
- `clipboard.writeText()` for copy
- For auto-paste: `clipboard.writeText()` then simulate Ctrl+V via `@nut-tree/nut-js` or `robotjs`
- Save previously-focused window handle before Koe activates

## MUS Priority Order

1. FR-001: Global Hotkey Toggle
2. FR-002: Mic Audio Capture
3. FR-003: Voice Activity Detection
4. FR-004: Audio Chunking
5. FR-005: Groq Whisper Transcription
6. FR-006: Rate Limiting
7. FR-007: Floating Transcription Window
8. FR-008: Clipboard Integration
9. FR-009: System Tray
10. FR-010: Settings: API Key

## Special Considerations

- **No React/Vue/Svelte** — UI is vanilla JS + CSS. DOM manipulation via `document.createElement` or template literals
- **electron-store** encrypts the API key field — use `encryptionKey` option
- **VAD model files** — Silero ONNX must be bundled with the app or loaded at runtime
- **Electron security** — `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` for renderer
- **Window management** — Floating window is `alwaysOnTop`, `frame: false`, `transparent: true` for glassmorphism
