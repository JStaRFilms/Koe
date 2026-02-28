# Task 03: Groq Integration

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| — | — | Groq API is OpenAI-compatible, standard REST |

### Check Additional Skills
> Scan all known skills directories for more relevant skills

---

## Objective
Implement the Groq Whisper transcription service and rate limiter in the main process. Handle API calls, error handling, retries, and queue management.

## Scope
**Covers FRs:** FR-005 (Groq Whisper), FR-006 (Rate Limiting)

**Files to Create:**
```
src/main/services/groq.js          — Whisper API + Llama API calls
src/main/services/rate-limiter.js  — Sliding window rate limiter + queue
```

**Files to Modify:**
```
package.json         — Add electron-store (if not already)
src/main/ipc.js      — Handle transcription requests from renderer
src/main/main.js     — Initialize groq service + rate limiter
src/shared/constants.js — Add transcription IPC channels
```

## Context
- **Prerequisite:** Task 02 (Audio Pipeline) must be complete
- Read FR-005, FR-006 issue files
- Builder Prompt §Groq API and §Rate Limiting

## Technical Requirements

### Groq Service (`groq.js`)
- `transcribe(wavBuffer, language)` — POST to Groq Whisper API
- Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
- Send as `multipart/form-data`: `file` (WAV blob), `model` ("whisper-large-v3-turbo"), `language`
- Parse response: `{ text: "..." }`
- Error handling: 429 → trigger rate limit queue, 401 → invalid key alert, network → retry once
- Read API key from electron-store (encrypted)

### Rate Limiter (`rate-limiter.js`)
- **Three limits to enforce:**
  - 20 requests per minute (sliding window)
  - 2,000 requests per day (counter, reset at midnight local time)
  - 28,800 audio seconds per day (cumulative, reset at midnight)
- **Queue:** FIFO queue for overflow chunks
  - When a slot opens (sliding window advances), dequeue and process
  - Configurable max queue size (default: 50)
- **Persistence:** Store daily counters in electron-store, keyed by date (YYYY-MM-DD)
- **API:** `canRequest()`, `recordRequest(audioSeconds)`, `getUsageStats()`, `enqueue(chunk)`, `processQueue()`

### IPC Integration
- Renderer sends WAV buffer → main process `ipcMain.handle('transcribe', ...)`
- Main process: rate limiter check → groq.transcribe() → return text to renderer
- If rate limited: queue the chunk, notify renderer "Processing..."
- Emit usage stats to renderer after each request

## Definition of Done
- [ ] WAV chunks transcribed via Groq Whisper API
- [ ] Transcribed text returned to renderer via IPC
- [ ] Rate limiter enforces 20 RPM (tested: 21st request queued)
- [ ] Rate limiter enforces 2,000 RPD (tested: shows "limit reached")
- [ ] Audio seconds tracked against 28,800/day
- [ ] Queued chunks processed when slots open
- [ ] API errors handled (429, 401, network) with user-friendly messages
- [ ] Daily stats persist across app restarts
- [ ] API key read from encrypted electron-store

## Expected Artifacts
- `groq.js` and `rate-limiter.js` services
- Updated IPC handlers
- End-to-end flow: hotkey → audio → WAV → Groq API → text in renderer

## Constraints
- All API calls happen in MAIN process only (never in renderer)
- API key never logged or exposed to renderer
- Use Node.js `fetch` (available in Electron 28+) or `node-fetch`
- Empty transcriptions (silence) should be filtered — don't send trivial results
