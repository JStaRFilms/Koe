import { encodeWAV } from './wav-encoder.js';

let MicVAD;
async function loadVAD() {
    if (!MicVAD) {
        const vad = await import('@ricky0123/vad-web');
        MicVAD = vad.MicVAD;
    }
    return MicVAD;
}

let vad;
let isListening = false;
let recordingFrames = [];
let currentSessionId = null;

async function getVadBasePath() {
    try {
        const isPackaged = await window.api?.isPackaged?.() || false;
        window.api?.log?.(`VAD: isPackaged = ${isPackaged}`);

        if (isPackaged) {
            const resourcesPath = await window.api?.getResourcesPath?.();
            if (resourcesPath) {
                const normalizedPath = resourcesPath.replace(/\\/g, '/');
                const encodedPath = encodeURI(normalizedPath);
                const vadPath = `file:///${encodedPath}/app.asar.unpacked/dist/renderer/assets/vad/`;
                window.api?.log?.(`VAD: Using unpacked path: ${vadPath}`);
                return vadPath;
            }

            window.api?.log?.('VAD: resourcesPath not available, falling back to relative path');
            return './assets/vad/';
        }

        return '/assets/vad/';
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
                if (!isListening || !frame || frame.length === 0) {
                    return;
                }

                recordingFrames.push(new Float32Array(frame));
            },

            onSpeechStart: () => {
                window.api?.log?.('VAD: Speech started');
            },

            onSpeechEnd: () => {
                window.api?.log?.('VAD: Speech ended');
            },

            onVADMisfire: () => {
                window.api?.log?.('VAD: Misfire (speech too short)');
            }
        });

        window.api?.log?.('VAD initialized successfully.');
    } catch (error) {
        console.error('VAD init error:', error);
        window.api?.log?.(`VAD init error: ${error.message}`);
        throw error;
    }
}

export async function startListening(sessionId) {
    if (!vad) {
        window.api?.log?.('VAD not initialized, cannot start listening.');
        return false;
    }

    currentSessionId = sessionId ?? currentSessionId;
    recordingFrames = [];
    isListening = true;
    await vad.start();
    window.api?.log?.(`VAD: Listening started for session ${currentSessionId}.`);
    return true;
}

export function isVADReady() {
    return !!vad;
}

export function stopListening(sessionId = currentSessionId) {
    if (!vad) return false;

    const finalSessionId = sessionId ?? currentSessionId;
    isListening = false;
    vad.pause();
    window.api?.log?.(`VAD: Listening paused for session ${finalSessionId}.`);

    if (recordingFrames.length === 0) {
        currentSessionId = null;
        return false;
    }

    const totalLength = recordingFrames.reduce((sum, frame) => sum + frame.length, 0);
    if (totalLength === 0) {
        recordingFrames = [];
        currentSessionId = null;
        return false;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const frame of recordingFrames) {
        merged.set(frame, offset);
        offset += frame.length;
    }

    recordingFrames = [];
    currentSessionId = null;
    sendAudioChunk(merged, finalSessionId);
    return true;
}

function sendAudioChunk(audio, sessionId) {
    if (!audio || audio.length === 0) {
        return;
    }

    const wavBuffer = encodeWAV(audio, 16000);
    const audioSeconds = audio.length / 16000;
    window.api.sendAudioChunk({ buffer: wavBuffer, audioSeconds, sessionId });
    window.api?.log?.(`Sent WAV chunk for session ${sessionId}: ${wavBuffer.byteLength} bytes (${audioSeconds.toFixed(1)}s).`);
}
