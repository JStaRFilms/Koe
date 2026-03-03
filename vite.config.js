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
 * Custom Vite plugin: serves /assets/vad/* assets as raw files BEFORE Vite's
 * transform pipeline ever touches them. This prevents Vite from treating
 * .mjs WASM glue files as ES modules to be processed.
 */
function vadAssetsPlugin() {
  return {
    name: 'vad-assets',
    enforce: 'pre', // Run before other plugins
    configureServer(server) {
      // Return a function to register middleware before Vite's internal middleware
      return () => {
        server.middlewares.use('/assets/vad/', (req, res, next) => {
          // Strip query strings Vite may append (?import, ?t=...)
          const cleanUrl = req.url.split('?')[0];
          const filename = cleanUrl.replace(/^\//, ''); // Remove leading slash
          const filePath = resolveVadAsset(filename);

          if (!filePath) {
            console.warn(`[VAD Plugin] File not found: ${filename}`);
            return next();
          }

          const ext = '.' + filename.split('.').pop();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';

          try {
            const data = readFileSync(filePath);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(data);
          } catch (err) {
            console.error(`[VAD Plugin] Error reading file: ${filePath}`, err);
            next();
          }
        });
      };
    },
  };
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
        settings: resolve(__dirname, 'src/renderer/settings-window.html')
      }
    }
  },
  optimizeDeps: {
    // Include VAD-related packages for proper CommonJS handling
    include: ['@ricky0123/vad-web', 'onnxruntime-web']
  },
  plugins: [
    vadAssetsPlugin(),
    viteStaticCopy({
      targets: [
        {
          // ORT WASM glue + binaries (relative to Vite root: src/renderer)
          src: '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{mjs,wasm}',
          dest: 'assets/vad',
        },
        {
          // Silero VAD ONNX models
          src: '../../node_modules/@ricky0123/vad-web/dist/silero_vad_{legacy,v5}.onnx',
          dest: 'assets/vad',
        },
        {
          // VAD worklet
          src: '../../node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: 'assets/vad',
        },
        {
          // Public VAD folder files (for production)
          src: '../../public/vad/*',
          dest: 'assets/vad',
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
