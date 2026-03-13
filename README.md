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

**Koe** (声, Japanese for "voice") is a free, open-source alternative to subscription-based voice dictation tools like WhisperFlow. Press a hotkey, speak naturally, pause when you need to think, and get polished text typed where your cursor already is.

Unlike cloud-based solutions that charge monthly fees, Koe uses your own [Groq API key](https://console.groq.com/keys) and stays free for up to 8 hours of transcription a day on Groq's free tier.

### Why Koe?

| Feature | WhisperFlow ($8+/mo) | Built-in OS Dictation | **Koe (Free)** |
|---------|---------------------|----------------------|----------------|
| Cost | Subscription | Free | **Free (BYOK)** |
| Accuracy | High | Poor | **High (Whisper)** |
| AI Enhancement | Yes | No | **Yes** |
| Privacy | Cloud audio | Local | **Local VAD + BYOK** |
| Global Hotkey | Yes | Limited | **Yes** |
| Auto-Paste | Yes | No | **Yes** |

---

## Features

- **Global Hotkey** — Press `Ctrl + Shift + Space` anywhere to start or stop dictation
- **Pause Naturally** — Koe keeps listening through short pauses instead of treating every breath like the end of a recording
- **Rolling Segments** — Long recordings are processed in the background as ordered chunks, so performance stays fast even on longer sessions
- **Instant Transcription** — Groq Whisper handles speech-to-text at high speed
- **AI Text Enhancement** — Each segment is refined before it is typed, so only polished text is committed to the target app
- **Auto-Type** — Refined text is typed progressively into the focused text field while you are still talking
- **Retry Failed Segments** — If a chunk fails, Koe retries only the missing part instead of rebuilding the entire session
- **Minimalist "Pill" UI** — A compact floating interface with live voice levels, recording state, and warnings
- **Transcription History** — One-click copy and retry for saved transcripts
- **Usage Dashboard** — Track daily audio seconds, request pressure, and queue activity

---

## Installation

### Download Pre-built Installer

1. Go to the [Releases](https://github.com/JStaRFilms/Koe/releases) page
2. Download the latest Windows installer asset
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

1. **Launch** Koe — it minimizes to your system tray
2. **Configure** — Right-click the tray icon → **Settings** → Enter your Groq API key
3. **Dictate** — Click any text field and press `Ctrl + Shift + Space`
4. **Speak** — The pill UI appears. Talk naturally, including pauses
5. **Done** — Press the hotkey again when you're finished. Koe finalizes the session, copies the full refined transcript, and keeps it in history

---

## Usage Guide

### Global Hotkeys

| Action | Shortcut |
|--------|----------|
| Start / Stop Recording | `Ctrl + Shift + Space` |
| Retry Last Failed / Latest Transcript | `Ctrl + Shift + ,` |
| Open Settings | Tray menu |

### How Recording Works

- Koe records one continuous session until you stop it
- Internally, it breaks longer recordings into ordered segments
- Segments are transcribed and refined in the background
- Refined text is typed in order as it becomes ready
- When the session ends, Koe keeps one full final transcript in clipboard and history

### The Pill UI

The floating pill is designed to stay out of the way while still telling you what matters:

- **Idle** — Waiting for the next dictation
- **Listening** — Live voice levels and active recording state
- **Warning** — Mic fallback or chunk failure without immediately killing the session
- **Processing** — Finalizing remaining work after you stop
- **Complete** — Brief success state before hiding

### Settings

Configure via the settings window (right-click the tray icon):

| Setting | Description | Default |
|---------|-------------|---------|
| Groq API Key | Your API key from [console.groq.com](https://console.groq.com/keys) | — |
| Language | Transcription language (`auto` for detection) | `auto` |
| Prompt Style | How Koe refines the transcript | `Clean` |
| Auto-Paste | Automatically type into the focused window | `enabled` |
| Theme | Dark / Light mode | `dark` |

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
│  │ Session Coordinator                  │  │
│  │ ├─ Ordered segment commit            │  │
│  │ ├─ Live auto-paste                   │  │
│  │ └─ Retry manifest + final transcript │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ Worker Thread                        │  │
│  │ ├─ Whisper STT (audio → text)        │  │
│  │ ├─ Transcript refinement             │  │
│  │ └─ RPM-aware request pacing          │  │
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
│  │ ├─ Silero VAD (local speech detect)  │   │
│  │ ├─ Rolling segment flush             │   │
│  │ └─ WAV encoder (segment → file)      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Privacy-First Design

1. **Voice Activity Detection** runs entirely offline using ONNX WebAssembly
2. **Audio segments** are only sent for transcription after speech has been captured
3. **Retry audio** is stored only for failed or unresolved segments, and only as temporary files
4. **Your API key** is stored locally via `electron-store`, never sent anywhere except Groq

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Electron + Vite |
| **Frontend** | Vanilla JavaScript, Custom CSS |
| **Audio Capture** | Web Audio API |
| **Voice Detection** | `@ricky0123/vad-web` (Silero VAD) |
| **Transcription** | Groq Whisper API (`whisper-large-v3-turbo`) |
| **Text Enhancement** | Groq chat refinement pipeline |
| **Storage** | `electron-store` + temp retry files |
| **Packaging** | `electron-builder` |

---

## Groq API Limits

Koe is designed to stay inside Groq's free-tier limits:

| Metric | Limit | Approximate Usage |
|--------|-------|-------------------|
| Requests per minute | 20 | ~6 transcribed segments/minute with paced refinement |
| Requests per day | 2,000 | ~8 hours of normal dictation |
| Audio per day | 28,800 sec | 8 hours |

The built-in scheduler tracks request pressure and keeps the app responsive while staying inside the cap.

---

## Roadmap

### Completed
- [x] Global hotkey toggle
- [x] Local VAD speech detection
- [x] Groq Whisper transcription
- [x] AI transcript refinement
- [x] Auto-paste to focused window
- [x] Transcription history
- [x] Usage dashboard
- [x] Long-session segmented processing
- [x] Retry for failed segments

### Planned
- [ ] Custom AI prompts
- [ ] Keyboard shortcut customization
- [ ] Export history as `.txt` / `.md`
- [ ] macOS support

### Future
- [ ] Snippet library with voice shortcuts
- [ ] App-specific tone profiles
- [ ] Cloud sync across devices
- [ ] Team collaboration features

See [Feature Requests](docs/issues/) for the full backlog.

---

## Contributing

Contributions are welcome. Please see the repo docs and existing code patterns before opening a PR.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/Koe.git
cd Koe

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Monorepo Structure

Koe is transitioning to a monorepo to support multiple platforms:

- **Root**: Legacy Electron Desktop app and shared workspace configuration
- **`apps/mobile`**: Expo-based mobile client (iOS/Android)
- **`packages/koe-core`**: Shared business logic, types, and API services

### Development Commands

| Target | Command | Description |
|--------|---------|-------------|
| **Desktop** | `pnpm dev` | Start the Electron app in dev mode |
| **Mobile** | `pnpm dev:mobile` | Start the Expo development server |
| **Core** | `pnpm build:core` | Build the shared logic package |
| **All** | `pnpm type-check` | Run type-checking across all packages |

### Project Structure

```text
Koe/
├── apps/               # Application projects
│   └── mobile/        # Expo mobile app
├── packages/           # Shared logic
│   └── koe-core/      # Core services (Whisper, Sessions)
├── src/                # Legacy Desktop source
│   ├── main/           # Electron main process
│   └── renderer/       # UI code
├── docs/               # Documentation & Tasks
├── pnpm-workspace.yaml # Workspace config
└── package.json        # Root manifest & scripts
```

---

## Troubleshooting

### "No audio detected"
- Ensure microphone permissions are granted in Windows Settings
- Check that your default recording device is selected
- If another app is holding the mic, Koe will try another available input and warn you in the pill UI

### "API rate limit exceeded"
- Wait for the per-minute window to clear
- Check the usage dashboard for queue pressure
- Very long continuous dictation can still pile up requests on the free tier

### "Auto-paste not working"
- Some applications block simulated keystrokes
- Disable auto-paste in Settings and use `Ctrl + V` manually
- Run Koe as administrator if the issue persists

### App won't launch
- Ensure you're on Windows 10/11 64-bit
- Check that [Visual C++ Redistributables](https://aka.ms/vs/17/release/vc_redist.x64.exe) are installed
- Check Windows Event Viewer for crash details

---

## Acknowledgments

- **Groq** — For the fast Whisper and chat APIs
- **Silero** — For the VAD model
- **@ricky0123** — For the `vad-web` library
- **WhisperFlow** — For helping prove the category exists

---

## License

Koe is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/JStaRFilms">J StaR Films Studios</a></p>
  <p><sub>Star us on GitHub if you find Koe useful.</sub></p>
</div>
