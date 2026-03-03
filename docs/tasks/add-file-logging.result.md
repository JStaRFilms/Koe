# Task Result: Add File Logging for Production Debugging

**Completed:** 2026-03-03  
**Status:** ✅ Complete

---

## Summary

Implemented a persistent file logging system that writes all application logs to a file in the user's data directory. This enables debugging of production builds where `console.log` output is not visible.

---

## Files Created

### 1. `src/main/services/logger.js` (NEW)
- Singleton logger service that writes to `userData/logs/koe.log`
- Features:
  - Timestamps for all log entries
  - Log levels: INFO, WARN, ERROR, DEBUG
  - Console output preserved for development convenience
  - Automatic log rotation (max 5MB, keeps 3 archived files)
  - Handles objects, errors, and nested data
  - Helper methods: `getLogPath()`, `getLogDirectory()`, `getRecentLogs()`

---

## Files Modified

### 2. `src/main/main.js`
- Added logger import
- Replaced all `console.log`/`console.error` with `logger.info`/`logger.error`
- Added log file location to startup info

### 3. `src/main/ipc.js`
- Added logger import and `shell` import
- Replaced console calls with logger in:
  - CHANNELS.LOG handler (renderer logs)
  - AUDIO_CHUNK pipeline
  - History export handler
- Added new IPC handler: `app:open-logs` to open logs folder

### 4. `src/main/services/groq.js`
- Added logger import
- Replaced `console.warn` calls with `logger.warn` for:
  - Network retry warnings
  - API error warnings
  - Enhancement warnings

### 5. `src/main/services/settings.js`
- Added logger import
- Replaced console calls with logger for:
  - Encryption key errors
  - Config corruption warnings
  - File deletion logging

### 6. `src/main/preload.js`
- Added `openLogsFolder: () => ipcRenderer.invoke('app:open-logs')` to API

### 7. `src/renderer/settings-window.html`
- Added "Advanced" section with "Open Logs Folder" button
- Includes document icon and help text

### 8. `src/renderer/components/settings-panel.js`
- Added `btnOpenLogs` element reference
- Added click listener for the Open Logs button
- Added `openLogsFolder()` method with loading state and error handling

---

## Log File Location

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\Koe\logs\koe.log` |
| macOS | `~/Library/Application Support/Koe/logs/koe.log` |
| Linux | `~/.config/Koe/logs/koe.log` |

Example Windows path: `C:\Users\<username>\AppData\Roaming\Koe\logs\koe.log`

---

## Log Format

```
[2026-03-03T16:22:15.123Z] [INFO] [Main] App starting...
[2026-03-03T16:22:15.145Z] [INFO] [Main] Log file location: C:\Users\...\koe.log
[2026-03-03T16:22:15.234Z] [ERROR] [Pipeline] Transcription error: Error: Network timeout
```

---

## User Access

Users can now access logs via:
1. **Settings Window → Advanced → "Open Logs Folder" button**
2. Manually navigating to the log location

---

## Testing Notes

- Logs persist across app restarts
- Log rotation occurs when file exceeds 5MB
- Both console and file output work simultaneously
- Debug logs only appear in development mode (`!app.isPackaged`)
- Error objects include full stack traces in log file

---

## Benefits

1. **Production Debugging**: Users can now provide logs when reporting issues
2. **Persistent History**: Logs survive app crashes and restarts
3. **Human Readable**: ISO timestamps and clear log levels
4. **Automatic Maintenance**: Old logs are rotated automatically
5. **Easy Access**: One-click button in settings to open logs folder
