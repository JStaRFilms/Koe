# Escalation Handoff Report

**Generated:** 2026-03-01T21:09:56+01:00
**Original Issue:** Audio pipeline not producing transcriptions — VAD initializes but never fires speech events

---

## PART 1: THE DAMAGE REPORT

### 1.1 Original Goal
Get the full audio pipeline working end-to-end: mic → AudioWorklet → VAD speech detection → WAV encoding → Groq transcription → display result. The VAD initialization was previously fixed. The current issue is that **no speech events fire** and **no transcription occurs**.

### 1.2 Observed Failure / Error
```
[Renderer] VAD initialized successfully.
Global hotkey triggered. Recording state: true
[Renderer] Microphone capture started at 16kHz.
[Renderer] Recording toggled: true
Global hotkey triggered. Recording state: false
[Renderer] Microphone capture stopped.
[Renderer] Recording toggled: false
```

**Missing from logs:** No "VAD: Speech started", "VAD: Speech ended", "Sent WAV chunk", or any transcription/error from Groq. The pipeline is completely silent after mic capture starts.

### 1.3 Root Cause Analysis — THREE BUGS IDENTIFIED

#### BUG 1: IPC Channel Mismatch (CRITICAL)
**File:** `preload.js` line 22 vs `ipc.js` line 42

```javascript
// preload.js — uses ipcRenderer.send() (fire-and-forget, one-way)
sendAudioChunk: (arrayBuffer) => ipcRenderer.send(CHANNELS.AUDIO_CHUNK, arrayBuffer),

// ipc.js — uses ipcMain.handle() (expects ipcRenderer.invoke(), two-way)
ipcMain.handle(CHANNELS.AUDIO_CHUNK, async (event, { buffer, audioSeconds }) => { ... });
```

`ipcRenderer.send()` triggers `ipcMain.on()`, NOT `ipcMain.handle()`. Since the handler is registered with `.handle()`, the audio chunk message is **silently dropped** — never processed.

Additionally, the preload sends a raw `arrayBuffer`, but the handler destructures `{ buffer, audioSeconds }` — this is a second mismatch even if the channel type were fixed.

#### BUG 2: VAD Never Started (CRITICAL)
**File:** `vad.js` line 13, 19 + `mic-capture.js` line 31-33

The MicVAD is created with `startOnLoad: false` and `getStream: async () => null`. This means the internal stream is never initialized. While `processFrame()` is called from the worklet, the MicVAD internal state machine requires `vad.start()` to be called first to initialize its `FrameProcessor`. Without `.start()`, calls to `processFrame()` are silently ignored because the internal frame processor was never set up.

The design intent was to feed audio manually via `processFrame()`, but MicVAD's internal architecture requires the lifecycle to be started first.

#### BUG 3: COOP/COEP Headers May Block Electron Resources (MINOR)
**File:** `vite.config.js` lines 103-106

```javascript
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}
```

These headers enable `SharedArrayBuffer` for threaded WASM, but in an Electron BrowserWindow they can block loading of local resources (preload scripts, `file://` resources) unless the Electron window has matching settings. This may cause subtle failures.

### 1.4 Key Files Involved
- `src/main/preload.js` — IPC bridge (BUG 1)
- `src/main/ipc.js` — IPC handlers (BUG 1)
- `src/renderer/audio/vad.js` — VAD init + processFrame (BUG 2)
- `src/renderer/audio/mic-capture.js` — Audio worklet → VAD bridge
- `src/renderer/audio/wav-encoder.js` — WAV encoding (fine)
- `src/renderer/audio/audio-processor.worklet.js` — AudioWorklet (fine)
- `src/renderer/index.js` — App orchestration
- `src/main/services/groq.js` — Transcription API
- `src/shared/constants.js` — Channel names
- `vite.config.js` — Server config (BUG 3)

---

## PART 2: FULL FILE CONTENTS (Self-Contained)

### File: `src/main/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');
const { CHANNELS } = require('../shared/constants');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    // Receive hotkey/tray toggle events
    onRecordingToggle: (callback) => {
        // Remove all previous listeners to avoid duplicates on reload
        ipcRenderer.removeAllListeners(CHANNELS.RECORDING_TOGGLED);
        ipcRenderer.on(CHANNELS.RECORDING_TOGGLED, (event, isRecording) => callback(isRecording));
    },

    // Settings
    getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.SAVE_SETTINGS, settings),
    testGroqKey: (apiKey) => ipcRenderer.invoke(CHANNELS.TEST_GROQ_KEY, apiKey),

    // Debug
    log: (message) => ipcRenderer.send(CHANNELS.LOG, message),

    // Audio
    sendAudioChunk: (arrayBuffer) => ipcRenderer.send(CHANNELS.AUDIO_CHUNK, arrayBuffer),

    // Window Controls
    minimizeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_MINIMIZE),
    closeWindow: () => ipcRenderer.send(CHANNELS.WINDOW_CLOSE),

    // Transcription Events
    onTranscriptionStatus: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_STATUS);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_STATUS, (event, status) => callback(status));
    },
    onTranscriptionResult: (callback) => {
        ipcRenderer.removeAllListeners(CHANNELS.TRANSCRIPTION_RESULT);
        ipcRenderer.on(CHANNELS.TRANSCRIPTION_RESULT, (event, text) => callback({ text }));
    }
});
```

### File: `src/main/ipc.js`
```javascript
const { ipcMain } = require('electron');
const { CHANNELS } = require('../shared/constants');
const { getSettings, setSettings } = require('./services/settings');
const { transcribe, enhance, validateApiKey } = require('./services/groq');
const rateLimiter = require('./services/rate-limiter');
const { autoPaste } = require('./services/clipboard');

function setupIpcHandlers(mainWindow) {
    ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
        return getSettings();
    });

    ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, newSettings) => {
        setSettings(newSettings);
        return true;
    });

    ipcMain.handle(CHANNELS.TEST_GROQ_KEY, async (event, apiKey) => {
        return validateApiKey(apiKey);
    });

    ipcMain.handle(CHANNELS.GET_USAGE_STATS, async () => {
        return rateLimiter.getUsageStats();
    });

    ipcMain.on(CHANNELS.LOG, (event, message) => {
        console.log('[Renderer]', message);
    });

    ipcMain.on(CHANNELS.WINDOW_MINIMIZE, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });

    ipcMain.on(CHANNELS.WINDOW_CLOSE, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide(); // As per main.js logic, close hides it to tray
        }
    });

    ipcMain.handle(CHANNELS.AUDIO_CHUNK, async (event, { buffer, audioSeconds }) => {
        try {
            const settings = getSettings();

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'processing');
            }

            let text = await transcribe(buffer, audioSeconds, settings.language || 'auto');

            if (text && settings.enhanceText) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, 'enhancing');
                }
                text = await enhance(text, settings.promptStyle || 'Clean');
            }

            if (text && settings.autoPaste) {
                autoPaste(text);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
                if (text) {
                    mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_RESULT, text);
                }
            }
            return text;
        } catch (error) {
            console.error('Transcription error:', error);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(CHANNELS.TRANSCRIPTION_STATUS, `error: ${error.message}`);
                mainWindow.webContents.send(CHANNELS.USAGE_STATS, rateLimiter.getUsageStats());
            }
            throw error;
        }
    });
}

module.exports = {
    setupIpcHandlers
};
```

### File: `src/renderer/audio/vad.js`
```javascript
import { MicVAD } from "@ricky0123/vad-web";
import { encodeWAV } from "./wav-encoder.js";

let vad;
let isSpeechActive = false;

export async function initVAD() {
    if (vad) return;
    try {
        vad = await MicVAD.new({
            positiveSpeechThreshold: 0.5,
            minSpeechFrames: 3,
            startOnLoad: false,
            // Serve VAD assets from custom /vad/ middleware (bypasses Vite transforms)
            baseAssetPath: '/vad/',
            onnxWASMBasePath: '/vad/',

            // Override getStream so it never activates the mic on its own
            getStream: async () => null,

            onSpeechStart: () => {
                window.api.log('VAD: Speech started');
                isSpeechActive = true;
            },

            onSpeechEnd: (audio) => {
                window.api.log('VAD: Speech ended');
                isSpeechActive = false;

                // process to WAV and send to main
                if (audio && audio.length > 0) {
                    const wavBuffer = encodeWAV(audio, 16000);
                    window.api.sendAudioChunk(wavBuffer);
                    window.api.log(`Sent WAV chunk: ${wavBuffer.byteLength} bytes.`);
                }
            },
            onVADMisfire: () => {
                window.api.log('VAD: Misfire (speech too short)');
                isSpeechActive = false;
            }
        });

        window.api.log('VAD initialized successfully.');
    } catch (error) {
        console.error('VAD init error:', error);
        window.api.log(`VAD init error: ${error.message}`);
    }
}

export async function processAudioFrame(frame) {
    if (vad) {
        await vad.processFrame(frame);
    }
}
```

### File: `src/renderer/audio/mic-capture.js`
```javascript
import workletUrl from './audio-processor.worklet.js?url';
import { processAudioFrame } from './vad.js';

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let workletNode = null;

export async function startCapture() {
    if (mediaStream) return;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

        // Ensure worklet is loaded
        await audioContext.audioWorklet.addModule(workletUrl);

        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        workletNode = new AudioWorkletNode(audioContext, 'audio-processor');

        workletNode.port.onmessage = (event) => {
            const audioData = event.data; // Float32Array
            processAudioFrame(audioData);
        };

        sourceNode.connect(workletNode);
        // Note: Do not connect workletNode to audioContext.destination to avoid feedback loops!

        window.api.log('Microphone capture started at 16kHz.');
    } catch (error) {
        console.error('Mic capture error:', error);
        window.api.log(`Mic permissions error: ${error.message}`);
        // Surface error to UI (in future or via some callback)
        throw error;
    }
}

export function stopCapture() {
    if (workletNode) {
        workletNode.disconnect();
        workletNode = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    window.api.log('Microphone capture stopped.');
}
```

### File: `src/renderer/audio/audio-processor.worklet.js`
```javascript
class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const channelData = input[0];
            // Copy data to avoid mutation issues before posting it
            const dataToPost = new Float32Array(channelData);
            this.port.postMessage(dataToPost);
        }
        return true;
    }
}

// Register the worklet processor
registerProcessor('audio-processor', AudioProcessor);
```

### File: `src/renderer/audio/wav-encoder.js`
```javascript
// Encode Float32Array PCM samples to ArrayBuffer (Valid WAV file)
export function encodeWAV(samples, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
}
```

### File: `src/renderer/index.js`
```javascript
import { startCapture, stopCapture } from './audio/mic-capture.js';
import { initVAD } from './audio/vad.js';
import { FloatingWindow } from './components/floating-window.js';
import { SettingsPanel } from './components/settings-panel.js';

let isRecording = false;
let ui;
let settingsUI;

// Initialize app
async function init() {
    ui = new FloatingWindow();
    ui.setState('idle');

    settingsUI = new SettingsPanel();

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            settingsUI.show();
        });
    }

    if (window.api) {
        window.api.log('Renderer successfully initialized.');

        // Initialize VAD model locally in the background
        initVAD().catch(e => window.api.log(`VAD initialization error: ${e.message}`));

        // Listen for recording toggles from main process
        window.api.onRecordingToggle(async (recordingState) => {
            isRecording = recordingState;
            updateUI();

            try {
                if (isRecording) {
                    await startCapture();
                } else {
                    stopCapture();
                }
            } catch (err) {
                isRecording = false;
                updateUI();
                window.api.log(`Failed to toggle mic capture: ${err.message}`);
            }

            // Debug
            window.api.log(`Recording toggled: ${isRecording}`);
        });

        // Listen for transcription results from main process if there is a way
        if (window.api.onTranscriptionResult) {
            window.api.onTranscriptionResult((result) => {
                if (result && result.text) {
                    ui.appendTranscription(result.text, true);
                }
            });
        }

        // Listen for processing status updates (if available)
        if (window.api.onTranscriptionStatus) {
            window.api.onTranscriptionStatus((status) => {
                if (status === 'processing') {
                    ui.setState('processing');
                } else if (status === 'done' || status === 'error') {
                    ui.setState(isRecording ? 'recording' : 'idle');
                }
            });
        }

        // Initial settings fetch and onboarding check
        const settings = await window.api.getSettings();
        window.api.log(`Loaded settings with hotkey: ${settings.hotkey}`);

        if (!settings.groqApiKey) {
            window.api.log('No API key found. Triggering first-launch settings panel.');
            settingsUI.show();
        }
    } else {
        console.warn('API bridge not found. Make sure Electron preload script is configured correctly.');
    }
}

function updateUI() {
    if (isRecording) {
        ui.setState('recording');
    } else {
        ui.setState('idle');
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
```

### File: `src/shared/constants.js`
```javascript
const CHANNELS = {
    // Main -> Renderer
    RECORDING_TOGGLED: 'recording:toggled',
    USAGE_STATS: 'app:usage-stats',
    TRANSCRIPTION_RESULT: 'transcription:result',
    TRANSCRIPTION_STATUS: 'transcription:status',

    // Renderer -> Main
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    GET_USAGE_STATS: 'app:get-usage-stats',
    LOG: 'app:log',
    AUDIO_CHUNK: 'audio:chunk',
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_CLOSE: 'window:close',
    TEST_GROQ_KEY: 'settings:test-key',
    OPEN_SETTINGS: 'window:open-settings'
};

const DEFAULT_SETTINGS = {
    groqApiKey: '',
    hotkey: 'CommandOrControl+Shift+Space',
    language: 'auto',
    enhanceText: true,
    autoPaste: false,
    theme: 'dark',
    promptStyle: 'Clean'
};

module.exports = {
    CHANNELS,
    DEFAULT_SETTINGS
};
```

### File: `src/main/services/groq.js`
```javascript
const { getSetting } = require('./settings');
const rateLimiter = require('./rate-limiter');

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'whisper-large-v3-turbo';
const ENHANCE_MODEL = 'llama-3.3-70b-versatile';

async function transcribeDirect(wavBuffer, language = 'auto') {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) {
        throw new Error('Groq API Key is not configured. Please open settings and add your API Key.');
    }

    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', MODEL);

    if (language && language !== 'auto') {
        formData.append('language', language);
    }

    let retries = 1;

    while (retries >= 0) {
        try {
            const response = await fetch(GROQ_WHISPER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (response.status === 401) {
                throw new Error('Invalid Groq API Key. Please verify your credentials in settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded (429).');
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Filter trivial results / hallucinations from silence
            if (!data.text || data.text.trim().length === 0 || data.text.trim().toLowerCase().includes('thanks for watching')) {
                return '';
            }

            return data.text.trim();

        } catch (error) {
            if (error.message.includes('Rate limit') || error.message.includes('Invalid API Key') || retries === 0) {
                throw error;
            }
            console.warn(`[Groq] Network error, retrying... (${error.message})`);
            await new Promise(r => setTimeout(r, 1000));
            retries--;
        }
    }
}

async function transcribe(wavBuffer, audioSeconds = 0, language = 'auto') {
    const item = { wavBuffer, audioSeconds, language };

    // Defer the execution to rate-limiter which executes it once the slot opens
    const processFunction = async (taskItem) => {
        return await transcribeDirect(taskItem.wavBuffer, taskItem.language);
    };

    return rateLimiter.enqueue(item, processFunction);
}

async function validateApiKey(apiKey) {
    if (!apiKey) return false;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function enhance(rawText, promptStyle = 'Clean') {
    const apiKey = getSetting('groqApiKey');
    if (!apiKey) return rawText;

    let systemPrompt = "Clean this dictated text. Remove filler words, fix punctuation and grammar. Keep original meaning and tone. Return only the cleaned text.";
    if (promptStyle === 'Formal') {
        systemPrompt = "Rewrite this dictated text in a formal, professional tone. Fix punctuation and grammar. Return only the cleaned text.";
    } else if (promptStyle === 'Casual') {
        systemPrompt = "Clean this up, keep it casual and conversational. Fix punctuation and grammar. Return only the cleaned text.";
    } else if (promptStyle === 'Bullets') {
        systemPrompt = "Convert this dictated text into concise bullet points. Return only the bullet points.";
    }

    try {
        const response = await fetch(GROQ_CHAT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ENHANCE_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: rawText }
                ],
                temperature: 0.3,
                max_completion_tokens: 1024
            })
        });

        if (!response.ok) {
            console.warn('[Enhance] API error', response.status);
            return rawText; // fallback
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.warn('[Enhance] Network error', error.message);
        return rawText; // fallback
    }
}

module.exports = {
    transcribe,
    transcribeDirect,
    enhance,
    validateApiKey
};
```

### File: `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Map file extensions to correct MIME types for ONNX/WASM assets
const MIME_TYPES = {
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.mjs': 'application/javascript',
  '.js': 'application/javascript',
};

// Map /vad/* filenames to their actual locations in node_modules
function resolveVadAsset(filename) {
  const onnxDir = resolve(__dirname, 'node_modules/onnxruntime-web/dist');
  const vadDir = resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist');

  // ORT WASM files (glue .mjs + .wasm binaries)
  if (filename.startsWith('ort-wasm') || filename.startsWith('ort.')) {
    const full = resolve(onnxDir, filename);
    if (existsSync(full)) return full;
  }

  // VAD model files (.onnx) and worklet (.js)
  const full = resolve(vadDir, filename);
  if (existsSync(full)) return full;

  return null;
}

/**
 * Custom Vite plugin: serves /vad/* assets as raw files BEFORE Vite's
 * transform pipeline ever touches them. This prevents Vite from treating
 * .mjs WASM glue files as ES modules to be processed.
 */
function vadAssetsPlugin() {
  return {
    name: 'vad-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/vad/')) return next();

        const clean = req.url.split('?')[0];
        const filename = clean.replace('/vad/', '');
        const filePath = resolveVadAsset(filename);

        if (!filePath) return next();

        const ext = '.' + filename.split('.').pop();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        try {
          const data = readFileSync(filePath);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  plugins: [
    vadAssetsPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{mjs,wasm}',
          dest: 'vad',
        },
        {
          src: '../../node_modules/@ricky0123/vad-web/dist/silero_vad_{legacy,v5}.onnx',
          dest: 'vad',
        },
        {
          src: '../../node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: 'vad',
        },
      ],
    }),
  ],

  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
```

---

## PART 3: DIRECTIVE FOR ORCHESTRATOR

**Attention: Senior AI Orchestrator**

You have received this Escalation Handoff Report. A local agent has failed to solve this problem (long context window).

**Your Directive:**

### Fix 1: IPC Channel Mismatch (preload.js + ipc.js)
The `AUDIO_CHUNK` handler in `ipc.js` uses `ipcMain.handle()` but the preload sends via `ipcRenderer.send()`. These are incompatible Electron IPC patterns.

**Option A (Recommended):** Change `ipc.js` to use `ipcMain.on()` instead of `ipcMain.handle()` for `AUDIO_CHUNK`, since the renderer doesn't need a return value.

**Option B:** Change `preload.js` to use `ipcRenderer.invoke()` instead of `ipcRenderer.send()`.

Additionally, the preload sends a raw `arrayBuffer` but `ipc.js` destructures `{ buffer, audioSeconds }`. The `vad.js` `onSpeechEnd` callback calls `window.api.sendAudioChunk(wavBuffer)` with just the buffer. Fix the signature mismatch — either:
- Wrap the call in `vad.js`: `window.api.sendAudioChunk({ buffer: wavBuffer, audioSeconds: audio.length / 16000 })`
- Or change the handler to accept the raw buffer directly

### Fix 2: VAD Lifecycle (vad.js)
The MicVAD requires `.start()` to be called before `.processFrame()` is functional. The internal `FrameProcessor` is only initialized during the start lifecycle. Two options:

**Option A:** Call `vad.start()` after creation (ensure `getStream` returns a valid dummy stream or silent MediaStream).

**Option B:** Don't use MicVAD at all. Use the lower-level ONNX model directly from `@ricky0123/vad-web` to run inference on raw frames without the MicVAD lifecycle.

Recommendation: Option A — create a silent MediaStream with `audioContext.createMediaStreamDestination().stream` and pass it to `getStream`, then call `vad.start()`.

### Fix 3: COOP/COEP Headers (vite.config.js)
Test whether removing the COOP/COEP headers fixes any resource-loading issues in Electron. If `SharedArrayBuffer` is needed, configure it via Electron's `webPreferences` instead.

### Verification Steps
After applying fixes, the following logs should appear in order:
1. `VAD initialized successfully.`
2. `Microphone capture started at 16kHz.`
3. `VAD: Speech started` (when speaking)
4. `VAD: Speech ended` (when done speaking)
5. `Sent WAV chunk: XXXX bytes.`
6. (Groq transcription result displayed in UI)

**Begin your analysis now.**
