import { encodeWAV } from "./wav-encoder.js";

// Dynamic import for CommonJS module
let MicVAD;
async function loadVAD() {
    if (!MicVAD) {
        const vad = await import("@ricky0123/vad-web");
        MicVAD = vad.MicVAD;
    }
    return MicVAD;
}

let vad;
let isSpeaking = false;

/**
 * Accumulate raw speech frames ourselves.
 * MicVAD's onSpeechEnd only fires on natural silence detection —
 * if the user manually stops mid-speech, we need to flush this buffer.
 */
let speechFrames = [];

/**
 * Get the base path for VAD assets.
 * Uses different strategies for dev vs production.
 */
async function getVadBasePath() {
    try {
        // Check if we're in a packaged app
        const isPackaged = await window.api?.isPackaged?.() || false;
        window.api?.log?.(`VAD: isPackaged = ${isPackaged}`);

        if (isPackaged) {
            // In packaged app, files are in dist/renderer/assets/vad/
            // The renderer is loaded from app.asar/dist/renderer/index.html
            // Use relative path - the library will resolve it
            return './assets/vad/';
        } else {
            // In dev, use absolute path to bypass Vite's dep optimization
            return '/assets/vad/';
        }
    } catch (e) {
        window.api?.log?.(`VAD: Error checking isPackaged: ${e.message}, defaulting to dev path`);
        return '/assets/vad/';
    }
}

export async function initVAD() {
    if (vad) return;

    const basePath = await getVadBasePath();
    window.api?.log?.(`VAD: Initializing with basePath: ${basePath}`);

    try {
        const VADClass = await loadVAD();
        vad = await VADClass.new({
            positiveSpeechThreshold: 0.5,
            minSpeechFrames: 3,
            startOnLoad: false,
            baseAssetPath: basePath,
            onnxWASMBasePath: basePath,

            onFrameProcessed: (probabilities, frame) => {
                // Collect frames while speaking so we can flush on manual stop
                if (isSpeaking && frame && frame.length > 0) {
                    speechFrames.push(new Float32Array(frame));
                }
            },

            onSpeechStart: () => {
                isSpeaking = true;
                speechFrames = []; // Reset buffer on new speech segment
                window.api.log('VAD: Speech started');
            },

            onSpeechEnd: (audio) => {
                isSpeaking = false;
                speechFrames = []; // Clear our buffer — VAD handled it
                window.api.log('VAD: Speech ended');
                sendAudioChunk(audio);
            },

            onVADMisfire: () => {
                isSpeaking = false;
                speechFrames = [];
                window.api.log('VAD: Misfire (speech too short)');
            }
        });

        window.api.log('VAD initialized successfully.');
    } catch (error) {
        console.error('VAD init error:', error);
        window.api.log(`VAD init error: ${error.message}`);
    }
}

/** Start listening */
export async function startListening() {
    if (!vad) {
        window.api.log('VAD not initialized, cannot start listening.');
        return;
    }
    isSpeaking = false;
    speechFrames = [];
    await vad.start();
    window.api.log('VAD: Listening started.');
}

/**
 * Stop listening with manual flush.
 * If the user was mid-speech, we concatenate our accumulated frames
 * and send them as a WAV chunk — ensuring nothing is lost.
 */
export function stopListening() {
    if (!vad) return;

    // Flush: if user was speaking, encode our collected frames and send
    if (isSpeaking && speechFrames.length > 0) {
        window.api.log(`VAD: Force-flushing ${speechFrames.length} speech frames.`);

        // Concatenate all collected Float32Arrays into one
        const totalLength = speechFrames.reduce((sum, f) => sum + f.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const frame of speechFrames) {
            merged.set(frame, offset);
            offset += frame.length;
        }

        sendAudioChunk(merged);
    }

    isSpeaking = false;
    speechFrames = [];
    vad.pause();
    window.api.log('VAD: Listening paused.');
}

/** Encode and send audio chunk to main process */
function sendAudioChunk(audio) {
    if (audio && audio.length > 0) {
        const wavBuffer = encodeWAV(audio, 16000);
        const audioSeconds = audio.length / 16000;
        window.api.sendAudioChunk({ buffer: wavBuffer, audioSeconds });
        window.api.log(`Sent WAV chunk: ${wavBuffer.byteLength} bytes (${audioSeconds.toFixed(1)}s).`);
    }
}
