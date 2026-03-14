# Architecture & Core Logic

Koe (声) is built as a cross-platform monorepo where the heavy lifting of transcription management, provider communication, and business logic is unified in a shared core package.

## Workspace Layout

The repository is structured as a pnpm workspace:

- **Root**: Legacy Electron Desktop host.
- **`packages/koe-core`**: The central brain. Shared by both Desktop and Mobile.
- **`apps/mobile`**: React Native (Expo) mobile application.
- **`src/`**: Desktop-specific Electron source (Main and Renderer).

---

## The Shared Core (`packages/koe-core`)

The `@koe/core` package provides a platform-agnostic implementation of the transcription pipeline. This allows us to maintain consistent behavior across platforms while only implementing UI and platform-specific drivers (like audio capture) once per target.

### Key Responsibilities
- **Provider Management**: Handling API calls to Groq (Whisper for STT and Llama for refinement).
- **Session Orchestration**: Managing segments, ordering, and retries for long recordings.
- **Rate Limiting**: Enforcing Groq's RPM/RPD limits to protect the user's API key.
- **Types & Constants**: Shared definitions for settings, history, and IPC.

---

## Desktop Architecture (Electron)

The Desktop version focuses on high-efficiency "invisible" operation.

- **Main Process**: Handles global hotkeys, system tray, and manages the Electron lifecycle.
- **Renderer Process**: Handles audio capture (Web Audio API) and the floating "Pill" UI.
- **Auto-Paste**: Uses platform-native keystroke simulation to type polished text directly into the focused application.

---

## Mobile Architecture (Expo)

The Mobile version is optimized for on-the-go dictation and sharing.

- **Frontend**: Built with Expo Router and React Native.
- **Audio Driver**: Uses `expo-audio` for native microphone access and metering.
- **Clipboard-First Flow**: Unlike Desktop, Mobile V1 copies polished text to the clipboard rather than auto-pasting, as mobile OS constraints limit auto-typing into other apps.
- **Persistence**: Uses `expo-secure-store` for API keys, transcript history, retry state, and usage snapshots.

---

## Data Flow

```mermaid
flowchart TD
    subgraph "Platform Driver (Mobile or Desktop)"
        A[Mic Capture] --> B[Segmenter]
    end
    
    subgraph "@koe/core"
        B --> C[Transcription Service]
        C --> D[Whisper API]
        D --> E[Refinement Service]
        E --> F[Llama API]
    end
    
    subgraph "Output Handle"
        F --> G[Clipboard Utility]
        F --> H[Auto-Paste Driver (Desktop Only)]
    end
```

---

## Platform Limitations & Product Shape

### iOS V1
- **Clipboard-First**: iOS does not allow "auto-pasting" into third-party apps from a background process. Polished text is copied to the clipboard for the user to paste.
- **No Keyboard Mic**: Apple's custom keyboard extensions cannot reliably access the microphone. Koe operates as a standalone app to ensure high-fidelity audio capture.

### Android V1
- **Clipboard-First**: Similar to iOS, the initial focus is on a high-quality standalone app experience.
- **Future IME**: Android allows for richer IME (Input Method Editor) integrations, which may be explored in future versions to provide "Type-as-you-speak" inside other apps.

### Desktop
- **System-Wide Hotkeys**: Requires accessibility permissions on macOS or standard operation on Windows to register global shortcuts.
