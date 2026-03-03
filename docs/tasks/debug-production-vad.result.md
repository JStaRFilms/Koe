# VAD Production Build Fix - Results

**Task ID:** orch-20260303-debug  
**Status:** ✅ COMPLETED  
**Date:** 2026-03-03  

---

## Summary

Fixed the production build issue where VAD (Voice Activity Detection) would get stuck on "Transcribing" forever. The issue was caused by absolute asset paths that fail when the app runs via `file://` protocol in production.

---

## Root Cause Analysis

### Problem 1: Absolute Asset Paths
In `src/renderer/audio/vad.js`, the VAD was configured with absolute paths:
```javascript
baseAssetPath: '/vad/',
onnxWASMBasePath: '/vad/',
```

**Why this failed in production:**
- Dev mode: Vite dev server middleware intercepts `/vad/*` requests and serves from `node_modules/`
- Production: App loads via `file://` protocol from `dist/renderer/index.html`
- `/vad/` resolves to `file:///vad/` (doesn't exist on filesystem root)
- Actual assets are at `dist/renderer/vad/` (relative to HTML file)

### Problem 2: Missing WASM/MJS Files
The `public/vad/` folder only contained ONNX model files:
- ✅ `silero_vad_legacy.onnx`
- ✅ `silero_vad_v5.onnx`

Missing files required for ONNX runtime:
- ❌ `ort-wasm-simd-threaded.mjs` (WASM glue code)
- ❌ `ort-wasm-simd-threaded.wasm` (WASM binary)
- ❌ `vad.worklet.bundle.min.js` (VAD audio worklet)

---

## Fixes Applied

### Fix 1: Changed to Relative Paths
**File:** `src/renderer/audio/vad.js` (lines 21-22)

```diff
- baseAssetPath: '/vad/',
- onnxWASMBasePath: '/vad/',
+ baseAssetPath: './vad/',
+ onnxWASMBasePath: './vad/',
```

This ensures assets load relative to the HTML file location, working correctly in both dev and production.

### Fix 2: Added Missing WASM/MJS Files
**Location:** `public/vad/`

Copied the following files from `node_modules`:
- `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs` → `public/vad/`
- `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm` → `public/vad/`
- `node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js` → `public/vad/`

### Final public/vad/ Contents
```
public/vad/
├── ort-wasm-simd-threaded.mjs      (24 KB) - WASM glue code
├── ort-wasm-simd-threaded.wasm     (12 MB) - ONNX runtime WASM
├── silero_vad_legacy.onnx          (1.7 MB) - VAD model (legacy)
├── silero_vad_v5.onnx              (2.2 MB) - VAD model (v5)
└── vad.worklet.bundle.min.js       (2.5 KB) - Audio worklet
```

---

## Build Verification

### Production Build Results
```
✓ Vite build completed successfully
✓ vite-plugin-static-copy: Copied 5 items
✓ electron-builder: Package created (release/Koe Setup 1.0.0.exe)
```

### dist/renderer/vad/ Contents
All 5 VAD files are correctly present in the production build:
```
dist/renderer/vad/
├── ort-wasm-simd-threaded.mjs
├── ort-wasm-simd-threaded.wasm
├── silero_vad_legacy.onnx
├── silero_vad_v5.onnx
└── vad.worklet.bundle.min.js
```

---

## Testing Notes

To verify the fix works:
1. Install the built app: `release/Koe Setup 1.0.0.exe`
2. Launch the app
3. Use the transcription shortcut (default: CapsLock)
4. Speak - transcription should complete successfully
5. Check DevTools console for any 404 errors loading VAD assets

Expected behavior:
- No console errors about failing to load `/vad/*` resources
- VAD initializes successfully
- Speech is detected and transcribed
- No "stuck on Transcribing" state

---

## Files Modified

| File | Change |
|------|--------|
| `src/renderer/audio/vad.js` | Changed paths from `/vad/` to `./vad/` |
| `public/vad/ort-wasm-simd-threaded.mjs` | Added (new file) |
| `public/vad/ort-wasm-simd-threaded.wasm` | Added (new file) |
| `public/vad/vad.worklet.bundle.min.js` | Added (new file) |

---

## Lessons Learned

1. **Absolute paths in Electron:** Using `/` paths works in dev (Vite middleware) but fails in production (`file://` protocol)
2. **VAD asset requirements:** The `@ricky0123/vad-web` library requires not just ONNX models but also ONNX runtime WASM files
3. **Static copy verification:** Always verify that `vite-plugin-static-copy` actually copies all required files to the expected destination

---

*End of Report*
