import { MicVAD } from "@ricky0123/vad-web";
import { encodeWAV } from "./wav-encoder.js";

let vad;

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

            // Let MicVAD handle mic access internally via its own getUserMedia + AudioWorklet.
            // No getStream override — it uses the real mic when start() is called.

            onSpeechStart: () => {
                window.api.log('VAD: Speech started');
            },

            onSpeechEnd: (audio) => {
                window.api.log('VAD: Speech ended');

                // audio is Float32Array of PCM samples at 16kHz
                if (audio && audio.length > 0) {
                    const wavBuffer = encodeWAV(audio, 16000);
                    const audioSeconds = audio.length / 16000;
                    window.api.sendAudioChunk({ buffer: wavBuffer, audioSeconds });
                    window.api.log(`Sent WAV chunk: ${wavBuffer.byteLength} bytes (${audioSeconds.toFixed(1)}s).`);
                }
            },
            onVADMisfire: () => {
                window.api.log('VAD: Misfire (speech too short)');
            }
        });

        window.api.log('VAD initialized successfully.');
    } catch (error) {
        console.error('VAD init error:', error);
        window.api.log(`VAD init error: ${error.message}`);
    }
}

/** Start listening — MicVAD gets the mic and begins speech detection */
export async function startListening() {
    if (!vad) {
        window.api.log('VAD not initialized, cannot start listening.');
        return;
    }
    await vad.start();
    window.api.log('VAD: Listening started.');
}

/** Pause listening — stops processing but keeps model loaded */
export function stopListening() {
    if (!vad) return;
    vad.pause();
    window.api.log('VAD: Listening paused.');
}
