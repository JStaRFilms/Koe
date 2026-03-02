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
      // Registering directly (not in a returned fn) ensures this runs
      // BEFORE Vite's internal middleware, bypassing transforms.
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/vad/')) return next();

        // Strip query strings Vite may append (?import, ?t=...)
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
          // ORT WASM glue + binaries (relative to Vite root: src/renderer)
          src: '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{mjs,wasm}',
          dest: 'vad',
        },
        {
          // Silero VAD ONNX models
          src: '../../node_modules/@ricky0123/vad-web/dist/silero_vad_{legacy,v5}.onnx',
          dest: 'vad',
        },
        {
          // VAD worklet
          src: '../../node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: 'vad',
        },
      ],
    }),
  ],

  server: {
    port: 5173,
    strictPort: true,
    // COOP/COEP headers removed — they block Electron local resources.
    // If SharedArrayBuffer is needed, configure via Electron webPreferences.
  },
});
