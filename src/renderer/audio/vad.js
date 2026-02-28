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
            // Provide local paths for Vite to serve
            baseAssetPath: '/vad',
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
