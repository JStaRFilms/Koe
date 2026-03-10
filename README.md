<div align="center">
  <img src="src/assets/icons/logo.svg" width="120" alt="Koe Logo">
  <h1>Koe (声)</h1>
  <p><strong>Lightning-Fast, Privacy-First Voice Dictation for Windows</strong></p>

  [![Release](https://img.shields.io/github/v/release/JStaRFilms/Koe)](https://github.com/JStaRFilms/Koe/releases)
  [![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
  [![Electron](https://img.shields.io/badge/Electron-40.6.1-47848F?logo=electron)](https://electronjs.org/)
  [![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange)](https://groq.com/)
</div>

---

## What is Koe?

**Koe** (声, Japanese for "voice") is a free, open-source alternative to subscription-based voice dictation tools like WhisperFlow. Press a hotkey, speak naturally, and get polished text instantly pasted wherever your cursor is.

Unlike cloud-based solutions that charge monthly fees, Koe uses your own [Groq API key](https://console.groq.com/keys) — completely free for up to 8 hours of audio transcription per day.

### Why Koe?

| Feature | WhisperFlow ($8+/mo) | Built-in OS Dictation | **Koe (Free)** |
|---------|---------------------|----------------------|----------------|
| Cost | Subscription | Free | **Free (BYOK)** |
| Accuracy | High | Poor | **High (Whisper)** |
| AI Enhancement | Yes | No | **Yes (Llama)** |
| Privacy | Cloud audio | Local | **VAD local only** |
| Global Hotkey | Yes | Limited | **Yes** |
| Auto-Paste | Yes | No | **Yes** |

---

## Features

- **Global Hotkey** — Press `Ctrl + Shift + Space` anywhere to start dictating
- **Local Voice Activity Detection** — ONNX-powered VAD runs 100% offline on your machine. Audio only leaves your device when speech is detected
- **Instant Transcription** — Groq's Whisper API processes at 216x realtime speed
- **AI Text Enhancement** — Automatic cleanup of filler words, punctuation, and formatting via Llama 3
- **Auto-Type** — Transcribed text is automatically typed into any focused text field
- **Minimalist "Pill" UI** — Beautiful, non-intrusive floating interface with real-time visual feedback
- **Transcription History** — Scrollable history with one-click copy for past recordings
- **Usage Dashboard** — Track daily audio seconds and API rate limits

---

## Installation

### Download Pre-built Installer

1. Go to the [Releases](https://github.com/JStaRFilms/Koe/releases) page
2. Download the latest Windows installer asset from the release
3. Run the installer and launch Koe

### Build from Source

```bash
# Clone the repository
git clone https://github.com/JStaRFilms/Koe.git
cd Koe

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

### Release Builds

- Real release artifacts should be built on GitHub Actions, not locally
- Push a matching version tag such as `v1.0.5` after updating `package.json`
- The release workflow will build Windows and macOS and attach artifacts to that GitHub Release
- See [docs/release-process.md](docs/release-process.md)

### Requirements

- Windows 10/11 (64-bit)
- [Groq API Key](https://console.groq.com/keys) (free tier available)
- Microphone access

---

## Quick Start

1. **Launch** Koe — it will minimize to your system tray
2. **Configure** — Right-click the tray icon → **Settings** → Enter your Groq API key
3. **Dictate** — Click any text field and press `Ctrl + Shift + Space`
4. **Speak** — The pill UI appears. Talk naturally.
5. **Done** — Pause for 1 second or press the hotkey again. Text appears instantly!

---

## Usage Guide

### Global Hotkey

| Action | Shortcut |
|--------|----------|
| Start/Stop Recording | `Ctrl + Shift + Space` |
| Open Settings | Tray menu or `Ctrl + Shift + ,` |

### The Pill UI

The floating "pill" window provides visual feedback:

- **Idle** — Dimmed, shows last transcription
- **Listening** — Animated gradient, shows "Listening..."
- **Processing** — Pulsing, shows "Transcribing..."
- **Complete** — Brief success state, auto-copies to clipboard

### Settings

Configure via the settings window (right-click tray icon):

| Setting | Description | Default |
|---------|-------------|---------|
| Groq API Key | Your API key from [console.groq.com](https://console.groq.com/keys) | — |
| Language | Transcription language (`auto` for detection) | `auto` |
| AI Enhancement | Clean up filler words and punctuation | `enabled` |
| Auto-Paste | Automatically type into focused window | `enabled` |
| Theme | Dark/Light mode | `dark` |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           ELECTRON MAIN PROCESS             │
│  ┌──────────┐  ┌──────────────────────┐    │
│  │ System   │  │ Global Shortcuts     │    │
│  │ Tray     │  │ (Ctrl+Shift+Space)   │    │
│  └──────────┘  └──────────────────────┘    │
│  ┌──────────────────────────────────────┐  │
│  │ Groq Service                         │  │
│  │ ├─ Whisper STT (audio → text)        │  │
│  │ ├─ Llama LLM (text → clean)          │  │
│  │ └─ Rate Limiter (20 RPM / 2K RPD)    │  │
│  └──────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ IPC
┌──────────────────┴──────────────────────────┐
│           ELECTRON RENDERER                 │
│  ┌──────────────────────────────────────┐   │
│  │ Floating Pill UI                     │   │
│  │ (always-on-top, glassmorphism)       │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Audio Pipeline                       │   │
│  │ ├─ Web Audio API (mic capture)       │   │
│  │ ├─ AudioWorklet (processing)         │   │
│  │ ├─ Silero VAD (local speech detect)  │   │
│  │ └─ WAV encoder (chunk → file)        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Privacy-First Design

1. **Voice Activity Detection** runs entirely offline using ONNX WebAssembly
2. **Audio chunks** (~3-5 seconds) are only sent when speech is detected
3. **No audio storage** — processed and immediately discarded
4. **Your API key** — stored locally via `electron-store`, never transmitted elsewhere

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Electron + Vite |
| **Frontend** | Vanilla JavaScript, Custom CSS |
| **Audio Capture** | Web Audio API + AudioWorklet |
| **Voice Detection** | `@ricky0123/vad-web` (Silero VAD) |
| **Transcription** | Groq Whisper API (`whisper-large-v3-turbo`) |
| **Text Enhancement** | Groq Llama 3 (free tier) |
| **Storage** | `electron-store` (local encrypted) |
| **Packaging** | `electron-builder` |

---

## Groq API Limits

Koe respects Groq's free tier limits:

| Metric | Limit | Approximate Usage |
|--------|-------|-------------------|
| Requests per minute | 20 | ~4-5 min of continuous dictation |
| Requests per day | 2,000 | ~8 hours of audio |
| Audio per day | 28,800 sec | 8 hours |

The built-in rate limiter queues requests and displays usage in the UI dashboard.

---

## Roadmap

### Completed (v1.0.0)
- [x] Global hotkey toggle
- [x] Local VAD speech detection
- [x] Groq Whisper transcription
- [x] AI text enhancement (Llama)
- [x] Auto-paste to focused window
- [x] Transcription history
- [x] Usage dashboard

### Planned (v1.1.0)
- [ ] Custom AI prompts (formal, casual, bullet points)
- [ ] Keyboard shortcut customization
- [ ] Export history as .txt/.md
- [ ] MacOS support

### Future (v2.0+)
- [ ] Snippet library with voice shortcuts
- [ ] App-specific tone profiles
- [ ] Cloud sync across devices
- [ ] Team collaboration features

See [Feature Requests](docs/issues/) for full details.

---

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/Koe.git
cd Koe

# Install dependencies
pnpm install

# Create environment file
echo "VITE_GROQ_API_KEY=your_key_here" > .env.local

# Start development
pnpm dev
```

### Project Structure

```
Koe/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Entry point
│   │   ├── ipc.js      # IPC handlers
│   │   ├── services/   # API, settings, rate limiter
│   │   └── ...
│   ├── renderer/       # UI code
│   │   ├── components/ # Pill UI, panels
│   │   ├── audio/      # VAD, capture, encoding
│   │   └── ...
│   └── shared/         # Constants
├── docs/               # Documentation, tasks
├── public/             # Static assets
└── release/            # Build output
```

### Running Tests

```bash
# Coming in v1.1.0
pnpm test
```

---

## Troubleshooting

### "No audio detected"
- Ensure microphone permissions are granted in Windows Settings
- Check that your default recording device is selected
- Try adjusting VAD sensitivity in Settings

### "API rate limit exceeded"
- Wait 1 minute for the RPM limit to reset
- Check the usage dashboard to see remaining daily quota
- Consider upgrading to Groq's paid tier for higher limits

### "Auto-paste not working"
- Some applications block simulated keystrokes
- Disable auto-paste in Settings and use Ctrl+V manually
- Run Koe as administrator if the issue persists

### App won't launch
- Ensure you're on Windows 10/11 64-bit
- Check that [Visual C++ Redistributables](https://aka.ms/vs/17/release/vc_redist.x64.exe) are installed
- Check Windows Event Viewer for error details

---

## Acknowledgments

- **Groq** — For the blazing-fast Whisper and Llama APIs
- **Silero** — For the excellent VAD model
- **@ricky0123** — For the `vad-web` library
- **WhisperFlow** — For proving the concept (and the pricing model to avoid)

---

## License

Koe is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/JStaRFilms">J StaR Films Studios</a></p>
  <p><sub>Star us on GitHub if you find Koe useful!</sub></p>
</div>
