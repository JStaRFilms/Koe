# Coding Guidelines — Koe (声)

## Tech Stack

- **Runtime:** Electron (Main + Renderer processes)
- **Bundler:** Vite (renderer only)
- **Language:** Vanilla JavaScript (ES2022+)
- **Styling:** Vanilla CSS (custom properties, no frameworks)
- **Storage:** electron-store (local JSON, encrypted API key)
- **Packaging:** electron-builder

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.js              # Entry: app lifecycle, tray, shortcuts
│   ├── tray.js              # System tray setup
│   ├── shortcuts.js         # Global hotkey registration
│   ├── ipc.js               # IPC handler registration
│   ├── services/
│   │   ├── groq.js          # Whisper + Llama API calls
│   │   ├── rate-limiter.js  # 20 RPM / 2K RPD enforcer
│   │   ├── clipboard.js     # Copy + auto-paste
│   │   └── settings.js      # electron-store wrapper
│   └── preload.js           # Context bridge
│
├── renderer/                # Vite-bundled renderer
│   ├── index.html           # Main HTML shell
│   ├── index.js             # Renderer entry
│   ├── styles/
│   │   ├── main.css         # Global styles, design tokens
│   │   ├── floating.css     # Floating window styles
│   │   └── settings.css     # Settings panel styles
│   ├── components/
│   │   ├── floating-window.js   # Transcription display
│   │   ├── settings-panel.js    # Settings UI
│   │   ├── history-panel.js     # Transcription history
│   │   └── usage-meter.js       # API usage display
│   └── audio/
│       ├── mic-capture.js       # getUserMedia + AudioContext
│       ├── vad.js               # Silero VAD wrapper
│       ├── audio-processor.worklet.js  # AudioWorklet
│       └── wav-encoder.js       # PCM → WAV
│
├── shared/
│   └── constants.js         # Shared constants (channels, defaults)
│
└── assets/
    └── icons/               # Tray icons, app icon
```

## Coding Rules

### General
1. **No TypeScript** — Vanilla JS with JSDoc type annotations where helpful
2. **ES Module syntax** — `import`/`export` everywhere (Vite handles it)
3. **Const by default** — Use `const` unless reassignment is needed, then `let`. Never `var`
4. **Descriptive names** — `audioChunkBuffer` not `buf`, `isRecording` not `rec`
5. **Max 200 lines per file** — Split if approaching this limit
6. **No dead code** — Remove unused imports, functions, variables

### Electron-Specific
1. **Main process = services only** — No UI logic in main
2. **Renderer = UI only** — No Node.js APIs in renderer (use preload bridge)
3. **Context isolation ON** — Always use `contextBridge.exposeInMainWorld`
4. **Preload bridge whitelist** — Only expose what the renderer needs, nothing more
5. **IPC channels = constants** — Define in `shared/constants.js`, never hardcode strings

### CSS
1. **Custom Properties (CSS vars)** for theming — all colors, spacing, fonts as `--koe-*` tokens
2. **No inline styles** — All styling via CSS classes
3. **BEM-lite naming** — `.koe-window`, `.koe-window__text`, `.koe-window--recording`
4. **Glassmorphism** — Use `backdrop-filter: blur()`, semi-transparent backgrounds
5. **Dark theme first** — Light theme is a COULD feature

### Error Handling
1. **Every API call wrapped in try/catch** — Groq calls can fail
2. **User-facing errors** — Show toast/notification, never silent failures
3. **Rate limit errors** — Queue the request, show "processing" indicator
4. **Graceful degradation** — If enhancement fails, fall back to raw text

### Performance
1. **AudioWorklet for processing** — Never block the main thread with audio math
2. **Debounce UI updates** — Don't re-render on every audio frame
3. **Lazy load settings/history** — Only render when panels are opened
