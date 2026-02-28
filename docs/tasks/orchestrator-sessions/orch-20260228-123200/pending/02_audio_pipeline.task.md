# Task 02: Audio Pipeline

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| — | — | Audio APIs are web-native, no special skill needed |

### Check Additional Skills
> Scan all known skills directories for more relevant skills

---

## Objective
Build the complete audio capture pipeline: mic access → AudioWorklet processing → Silero VAD → audio chunking → WAV encoding. All in the renderer process.

## Scope
**Covers FRs:** FR-002 (Mic Capture), FR-003 (VAD), FR-004 (Audio Chunking)

**Files to Create:**
```
src/renderer/audio/mic-capture.js       — getUserMedia + AudioContext setup
src/renderer/audio/vad.js               — Silero VAD wrapper (@ricky0123/vad-web)
src/renderer/audio/audio-processor.worklet.js  — AudioWorklet for PCM extraction
src/renderer/audio/wav-encoder.js       — Float32 PCM → WAV file (16-bit, 16kHz, mono)
```

**Files to Modify:**
```
package.json     — Add @ricky0123/vad-web, onnxruntime-web
src/renderer/index.js  — Wire up audio pipeline on recording toggle
src/shared/constants.js — Add audio-related IPC channels
src/main/ipc.js  — Handle incoming audio chunks from renderer
```

## Context
- **Prerequisite:** Task 01 (Skeleton) must be complete
- Read FR-002, FR-003, FR-004 issue files in `docs/issues/`
- Builder Prompt §Audio Pipeline for technical details

## Technical Requirements

### Mic Capture (`mic-capture.js`)
- `getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })`
- Create `AudioContext` at 16kHz
- Connect `MediaStreamSource` → `AudioWorkletNode`
- Export `startCapture()` and `stopCapture()` functions
- Handle permission denied: surface error to UI

### AudioWorklet (`audio-processor.worklet.js`)
- Process 128-sample frames from mic
- Post Float32Array chunks to main thread via `port.postMessage`
- No heavy computation — just relay audio data

### VAD (`vad.js`)
- Initialize `@ricky0123/vad-web` with Silero model
- Events: `onSpeechStart`, `onSpeechEnd`, `onFrameProcessed`
- On speech start: begin accumulating PCM in buffer
- On speech end: finalize buffer, encode as WAV, send via IPC
- Configure: `positiveSpeechThreshold: 0.5`, `minSpeechFrames: 3`

### WAV Encoder (`wav-encoder.js`)
- Input: Float32Array PCM samples (16kHz, mono)
- Output: ArrayBuffer with valid WAV header + 16-bit PCM data
- WAV header: 44 bytes, RIFF format, 16kHz, 16-bit, mono
- Export `encodeWAV(samples, sampleRate)` function

### Integration Flow
```
Hotkey ON → startCapture() → AudioWorklet → VAD
  → speech detected → buffer PCM
  → speech ends → encodeWAV(buffer) → IPC to main
Hotkey OFF → stopCapture() → flush remaining buffer
```

## Definition of Done
- [ ] Mic permission requested and audio captured
- [ ] AudioWorklet processes audio without blocking main thread
- [ ] Silero VAD detects speech start and end correctly
- [ ] Speech segments encoded as valid WAV files (16-bit, 16kHz, mono)
- [ ] WAV chunks sent to main process via IPC
- [ ] `stopCapture()` properly releases mic and AudioContext
- [ ] Permission denied shows user-friendly error
- [ ] No memory leaks (buffers cleared after encoding)

## Expected Artifacts
- All files listed above
- Updated `package.json` with new dependencies
- Audio pipeline functional end-to-end (mic → WAV chunks in main process)

## Constraints
- All audio processing happens in renderer (Web APIs)
- Main process only receives encoded WAV blobs
- AudioWorklet, NOT ScriptProcessorNode (deprecated)
- Sample rate must be 16kHz for Whisper compatibility
- Silero ONNX model must be bundled/accessible in packaged app
