import { encodeWAV } from './wav-encoder.js';

const SAMPLE_RATE = 16000;
const MIN_CHUNK_SECONDS = 10;
const MIN_CHUNK_SAMPLES = SAMPLE_RATE * MIN_CHUNK_SECONDS;
const HARD_CAP_SECONDS = 30;
const HARD_CAP_SAMPLES = SAMPLE_RATE * HARD_CAP_SECONDS;
const PAUSE_CLOSE_MS = 1200;
const SPEECH_THRESHOLD = 0.5;
const MIN_SEGMENT_SECONDS = 0.25;

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
let currentSessionId = null;
let currentSequence = 0;
let sentSegments = 0;
let activeSegmentFrames = [];
let activeSegmentSamples = 0;
let activeSegmentSawSpeech = false;
let lastSpeechAt = 0;
let deviceChangeLoggingAttached = false;

const audioLevelListeners = new Set();
const recorderWarningListeners = new Set();

const AUDIO_CONSTRAINTS = {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
};

const MACOS_AUDIO_CONSTRAINTS = {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
};

function isMacOSPlatform() {
    const reportedPlatform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
    return /mac/i.test(reportedPlatform);
}

function notifyAudioLevelListeners(levels) {
    for (const listener of audioLevelListeners) {
        try {
            listener(levels);
        } catch (error) {
            window.api?.log?.(`[Audio] Live level listener failed: ${error.message}`);
        }
    }
}

function notifyRecorderWarning(message) {
    const detail = String(message || '').trim();
    if (!detail) {
        return;
    }

    window.api?.log?.(`[Audio] ${detail}`);
    for (const listener of recorderWarningListeners) {
        try {
            listener(detail);
        } catch (error) {
            window.api?.log?.(`[Audio] Recorder warning listener failed: ${error.message}`);
        }
    }
}

function normalizeChunkEnergy(chunkEnergy) {
    if (!Number.isFinite(chunkEnergy) || chunkEnergy <= 0.003) {
        return 0;
    }

    return Math.min(1, Math.pow(chunkEnergy * 18, 0.72));
}

function buildVisualizerLevels(frame, barCount = 7) {
    if (!frame?.length) {
        return Array.from({ length: barCount }, () => 0);
    }

    const chunkSize = Math.max(1, Math.floor(frame.length / barCount));
    const levels = [];

    for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
        const start = barIndex * chunkSize;
        const end = barIndex === barCount - 1
            ? frame.length
            : Math.min(frame.length, start + chunkSize);

        if (start >= frame.length) {
            levels.push(0);
            continue;
        }

        let sumSquares = 0;
        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
            const sample = frame[sampleIndex];
            sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / Math.max(1, end - start));
        levels.push(normalizeChunkEnergy(rms));
    }

    return levels;
}

function redactDeviceId(deviceId) {
    if (!deviceId) {
        return 'n/a';
    }

    if (deviceId === 'default' || deviceId === 'communications') {
        return deviceId;
    }

    return `${deviceId.slice(0, 8)}...`;
}

function formatAudioInputDevices(devices) {
    if (!devices.length) {
        return 'none';
    }

    return devices
        .map((device, index) => `${index + 1}:${device.label || '(label unavailable)'} [id=${redactDeviceId(device.deviceId)}]`)
        .join(' | ');
}

function buildAudioConstraints(device) {
    const audioConstraints = {
        ...(isMacOSPlatform() ? MACOS_AUDIO_CONSTRAINTS : AUDIO_CONSTRAINTS)
    };

    if (device?.deviceId && device.deviceId !== 'default') {
        audioConstraints.deviceId = { exact: device.deviceId };
    }

    return audioConstraints;
}

async function listAudioInputDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        return [];
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'audioinput');
    } catch (error) {
        window.api?.log?.(`[Audio] Failed to enumerate audio input devices: ${error.message}`);
        return [];
    }
}

async function openMicStream(contextLabel) {
    const devices = await listAudioInputDevices();
    window.api?.log?.(`[Audio] ${contextLabel}: inputs=${formatAudioInputDevices(devices)}`);

    if (!devices.length) {
        throw new Error('No microphone devices are available.');
    }

    const candidates = [];
    const seenIds = new Set();
    const defaultDevice = devices.find((device) => device.deviceId === 'default');
    if (defaultDevice) {
        candidates.push(defaultDevice);
        seenIds.add(defaultDevice.deviceId);
    }

    for (const device of devices) {
        if (!seenIds.has(device.deviceId)) {
            candidates.push(device);
            seenIds.add(device.deviceId);
        }
    }

    let lastError = null;

    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const constraints = buildAudioConstraints(candidate);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
            if (index > 0) {
                notifyRecorderWarning(`Preferred microphone was unavailable. Using ${candidate.label || 'another input'} instead.`);
            }
            return stream;
        } catch (error) {
            lastError = error;
            window.api?.log?.(
                `[Audio] Failed to open ${candidate.label || '(label unavailable)'} [id=${redactDeviceId(candidate.deviceId)}]: ${error.message}`
            );
        }
    }

    throw new Error(lastError?.message || 'Unable to open any microphone input.');
}

function attachDeviceChangeLogging() {
    if (deviceChangeLoggingAttached || !navigator.mediaDevices?.addEventListener) {
        return;
    }

    navigator.mediaDevices.addEventListener('devicechange', async () => {
        const devices = await listAudioInputDevices();
        notifyRecorderWarning(`Audio input devices changed. Available inputs: ${formatAudioInputDevices(devices)}`);
    });

    deviceChangeLoggingAttached = true;
}

function extractSpeechProbability(probabilities) {
    if (typeof probabilities === 'number' && Number.isFinite(probabilities)) {
        return probabilities;
    }

    if (!probabilities || typeof probabilities !== 'object') {
        return null;
    }

    const candidateKeys = ['isSpeech', 'speech', 'positiveSpeech', 'probability'];
    for (const key of candidateKeys) {
        const value = probabilities[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
    }

    return null;
}

function resetActiveSegment() {
    activeSegmentFrames = [];
    activeSegmentSamples = 0;
    activeSegmentSawSpeech = false;
    lastSpeechAt = 0;
}

function mergeFrames(frames) {
    const totalLength = frames.reduce((sum, frame) => sum + frame.length, 0);
    if (totalLength === 0) {
        return new Float32Array(0);
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const frame of frames) {
        merged.set(frame, offset);
        offset += frame.length;
    }

    return merged;
}

function emitSegment(audio) {
    if (!audio || audio.length === 0) {
        return false;
    }

    const audioSeconds = audio.length / SAMPLE_RATE;
    if (!activeSegmentSawSpeech || audioSeconds < MIN_SEGMENT_SECONDS) {
        return false;
    }

    const wavBuffer = encodeWAV(audio, SAMPLE_RATE);
    const sequence = currentSequence;
    currentSequence += 1;
    sentSegments += 1;

    window.api.sendAudioSegment({
        buffer: wavBuffer,
        audioSeconds,
        sessionId: currentSessionId,
        segmentId: `${currentSessionId}-${sequence}`,
        sequence
    });

    window.api?.log?.(
        `Sent audio segment ${sequence} for session ${currentSessionId}: ${wavBuffer.byteLength} bytes (${audioSeconds.toFixed(1)}s).`
    );
    return true;
}

function flushActiveSegment(reason = 'flush') {
    if (activeSegmentFrames.length === 0) {
        resetActiveSegment();
        return false;
    }

    const merged = mergeFrames(activeSegmentFrames);
    const didSend = emitSegment(merged);
    window.api?.log?.(
        `[Audio] ${didSend ? 'Flushed' : 'Discarded'} segment for session ${currentSessionId} (${reason}, ${(merged.length / SAMPLE_RATE).toFixed(2)}s).`
    );
    resetActiveSegment();
    return didSend;
}

async function getVadBasePath() {
    try {
        const isPackaged = await window.api?.isPackaged?.() || false;
        if (isPackaged) {
            const resourcesPath = await window.api?.getResourcesPath?.();
            if (resourcesPath) {
                const normalizedPath = resourcesPath.replace(/\\/g, '/');
                const encodedPath = encodeURI(normalizedPath);
                return `file:///${encodedPath}/app.asar.unpacked/dist/renderer/assets/vad/`;
            }

            return './assets/vad/';
        }

        return '/assets/vad/';
    } catch (error) {
        window.api?.log?.(`VAD base path resolution failed: ${error.message}`);
        return '/assets/vad/';
    }
}

export async function initVAD() {
    if (vad) {
        return;
    }

    attachDeviceChangeLogging();
    const basePath = await getVadBasePath();
    const VADClass = await loadVAD();
    vad = await VADClass.new({
        positiveSpeechThreshold: SPEECH_THRESHOLD,
        minSpeechFrames: 3,
        startOnLoad: false,
        baseAssetPath: basePath,
        onnxWASMBasePath: basePath,
        getStream: () => openMicStream('Opening microphone stream'),
        resumeStream: () => openMicStream('Resuming microphone stream'),
        pauseStream: async (stream) => {
            stream.getTracks().forEach((track) => track.stop());
        },
        onFrameProcessed: (probabilities, frame) => {
            if (!isListening || !frame || frame.length === 0) {
                return;
            }

            const frameCopy = new Float32Array(frame);
            activeSegmentFrames.push(frameCopy);
            activeSegmentSamples += frameCopy.length;
            notifyAudioLevelListeners(buildVisualizerLevels(frameCopy));

            const speechProbability = extractSpeechProbability(probabilities);
            if (speechProbability !== null && speechProbability >= SPEECH_THRESHOLD) {
                activeSegmentSawSpeech = true;
                lastSpeechAt = Date.now();
            }

            if (
                activeSegmentSawSpeech &&
                activeSegmentSamples >= MIN_CHUNK_SAMPLES &&
                lastSpeechAt &&
                (Date.now() - lastSpeechAt) >= PAUSE_CLOSE_MS
            ) {
                flushActiveSegment('silence-threshold');
                return;
            }

            if (activeSegmentSamples >= HARD_CAP_SAMPLES) {
                flushActiveSegment('max-segment-length');
            }
        },
        onSpeechStart: () => {
            lastSpeechAt = Date.now();
        },
        onSpeechEnd: () => {
            lastSpeechAt = Date.now();
        },
        onVADMisfire: () => {
            window.api?.log?.(`[Audio] VAD misfire in session ${currentSessionId}.`);
        }
    });

    window.api?.log?.('VAD initialized successfully.');
}

export async function startListening(sessionId) {
    if (!vad) {
        return false;
    }

    currentSessionId = sessionId ?? currentSessionId;
    currentSequence = 0;
    sentSegments = 0;
    resetActiveSegment();
    isListening = true;
    notifyAudioLevelListeners(buildVisualizerLevels(null));
    notifyRecorderWarning('');
    await vad.start();
    return true;
}

export function isVADReady() {
    return !!vad;
}

export function stopListening(sessionId = currentSessionId) {
    if (!vad) {
        return false;
    }

    const finalSessionId = sessionId ?? currentSessionId;
    isListening = false;
    notifyAudioLevelListeners(buildVisualizerLevels(null));
    vad.pause();

    const didFlush = flushActiveSegment('manual-stop');
    currentSessionId = null;
    window.api.notifyAudioSessionStopped({ sessionId: finalSessionId });
    return didFlush || sentSegments > 0;
}

export function subscribeAudioLevels(listener) {
    if (typeof listener !== 'function') {
        return () => {};
    }

    audioLevelListeners.add(listener);
    listener(buildVisualizerLevels(null));

    return () => {
        audioLevelListeners.delete(listener);
    };
}

export function subscribeRecorderWarnings(listener) {
    if (typeof listener !== 'function') {
        return () => {};
    }

    recorderWarningListeners.add(listener);
    return () => {
        recorderWarningListeners.delete(listener);
    };
}
