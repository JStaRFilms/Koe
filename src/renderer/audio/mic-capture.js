import workletUrl from './audio-processor.worklet.js?url';
import { processAudioFrame } from './vad.js';

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let workletNode = null;

export async function startCapture() {
    if (mediaStream) return;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

        // Ensure worklet is loaded
        await audioContext.audioWorklet.addModule(workletUrl);

        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        workletNode = new AudioWorkletNode(audioContext, 'audio-processor');

        workletNode.port.onmessage = (event) => {
            const audioData = event.data; // Float32Array
            processAudioFrame(audioData);
        };

        sourceNode.connect(workletNode);
        // Note: Do not connect workletNode to audioContext.destination to avoid feedback loops!

        window.api.log('Microphone capture started at 16kHz.');
    } catch (error) {
        console.error('Mic capture error:', error);
        window.api.log(`Mic permissions error: ${error.message}`);
        // Surface error to UI (in future or via some callback)
        throw error;
    }
}

export function stopCapture() {
    if (workletNode) {
        workletNode.disconnect();
        workletNode = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    window.api.log('Microphone capture stopped.');
}
