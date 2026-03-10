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
let deviceChangeLoggingAttached = false;
let sessionDiagnostics = createSessionDiagnostics();

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

function createSessionDiagnostics(sessionId = null) {
    return {
        sessionId,
        startedAt: 0,
        framesCaptured: 0,
        samplesCaptured: 0,
        sumSquares: 0,
        peak: 0,
        clippedSamples: 0,
        nonTrivialSamples: 0,
        speechStarts: 0,
        speechEnds: 0,
        misfires: 0,
        speechProbabilitySamples: 0,
        speechProbabilitySum: 0,
        maxSpeechProbability: null,
        minSpeechProbability: null
    };
}

function resetSessionDiagnostics(sessionId = null) {
    sessionDiagnostics = createSessionDiagnostics(sessionId);
    sessionDiagnostics.startedAt = Date.now();
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

function resolvePreferredAudioInput(devices) {
    const defaultDevice = devices.find((device) => device.deviceId === 'default');
    if (!defaultDevice) {
        return devices[0] || null;
    }

    const labelWithoutPrefix = defaultDevice.label?.replace(/^Default - /, '').trim();
    if (!labelWithoutPrefix) {
        return defaultDevice;
    }

    const concreteMatch = devices.find((device) => device.deviceId !== 'default' && device.label?.trim() === labelWithoutPrefix);
    return concreteMatch || defaultDevice;
}

function buildAudioConstraints(preferredDevice) {
    const audioConstraints = {
        ...(process.platform === 'darwin' ? MACOS_AUDIO_CONSTRAINTS : AUDIO_CONSTRAINTS)
    };

    if (preferredDevice?.deviceId && preferredDevice.deviceId !== 'default') {
        audioConstraints.deviceId = { exact: preferredDevice.deviceId };
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

async function getMicrophonePermissionState() {
    if (!navigator.permissions?.query) {
        return 'unavailable';
    }

    try {
        const status = await navigator.permissions.query({ name: 'microphone' });
        return status.state || 'unknown';
    } catch (error) {
        return `unsupported (${error.message})`;
    }
}

function sanitizeTrackSettings(settings = {}) {
    return {
        deviceId: redactDeviceId(settings.deviceId),
        groupId: redactDeviceId(settings.groupId),
        sampleRate: settings.sampleRate ?? 'n/a',
        sampleSize: settings.sampleSize ?? 'n/a',
        channelCount: settings.channelCount ?? 'n/a',
        latency: settings.latency ?? 'n/a',
        echoCancellation: settings.echoCancellation ?? 'n/a',
        noiseSuppression: settings.noiseSuppression ?? 'n/a',
        autoGainControl: settings.autoGainControl ?? 'n/a'
    };
}

function attachTrackEventLogging(track, contextLabel) {
    if (!track || track.__koeLoggingAttached) {
        return;
    }

    track.__koeLoggingAttached = true;

    track.addEventListener('ended', () => {
        window.api?.log?.(`[Audio] Track ended (${contextLabel}): ${track.label || 'unlabeled track'}`);
    });

    track.addEventListener('mute', () => {
        window.api?.log?.(`[Audio] Track muted (${contextLabel}): ${track.label || 'unlabeled track'}`);
    });

    track.addEventListener('unmute', () => {
        window.api?.log?.(`[Audio] Track unmuted (${contextLabel}): ${track.label || 'unlabeled track'}`);
    });
}

function logStreamDiagnostics(stream, contextLabel) {
    const track = stream?.getAudioTracks?.()[0];
    if (!track) {
        window.api?.log?.(`[Audio] ${contextLabel}: stream has no audio tracks.`);
        return;
    }

    attachTrackEventLogging(track, contextLabel);

    const details = {
        label: track.label || '(label unavailable)',
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: sanitizeTrackSettings(track.getSettings?.() || {})
    };

    window.api?.log?.(`[Audio] ${contextLabel}: ${JSON.stringify(details)}`);
}

async function openMicStream(contextLabel) {
    const permissionState = await getMicrophonePermissionState();
    const devicesBefore = await listAudioInputDevices();
    window.api?.log?.(`[Audio] ${contextLabel}: microphone permission=${permissionState}; inputs=${formatAudioInputDevices(devicesBefore)}`);

    const preferredInput = resolvePreferredAudioInput(devicesBefore);
    const audioConstraints = buildAudioConstraints(preferredInput);

    if (preferredInput) {
        window.api?.log?.(
            `[Audio] ${contextLabel}: requesting ${process.platform === 'darwin' ? 'raw macOS' : 'processed'} input from ` +
            `${preferredInput.label || '(label unavailable)'} [id=${redactDeviceId(preferredInput.deviceId)}] with constraints=${JSON.stringify(audioConstraints)}`
        );
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

    const devicesAfter = await listAudioInputDevices();
    if (devicesAfter.length) {
        window.api?.log?.(`[Audio] ${contextLabel}: inputs after permission grant=${formatAudioInputDevices(devicesAfter)}`);
    }

    logStreamDiagnostics(stream, contextLabel);
    return stream;
}

function attachDeviceChangeLogging() {
    if (deviceChangeLoggingAttached || !navigator.mediaDevices?.addEventListener) {
        return;
    }

    navigator.mediaDevices.addEventListener('devicechange', async () => {
        const devices = await listAudioInputDevices();
        window.api?.log?.(`[Audio] Audio input device change detected: ${formatAudioInputDevices(devices)}`);
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

function recordFrameDiagnostics(frame, probabilities) {
    sessionDiagnostics.framesCaptured += 1;
    sessionDiagnostics.samplesCaptured += frame.length;

    let localPeak = sessionDiagnostics.peak;
    let localSumSquares = sessionDiagnostics.sumSquares;
    let localClippedSamples = sessionDiagnostics.clippedSamples;
    let localNonTrivialSamples = sessionDiagnostics.nonTrivialSamples;

    for (const sample of frame) {
        const absolute = Math.abs(sample);
        localPeak = Math.max(localPeak, absolute);
        localSumSquares += sample * sample;

        if (absolute >= 0.98) {
            localClippedSamples += 1;
        }

        if (absolute >= 0.01) {
            localNonTrivialSamples += 1;
        }
    }

    sessionDiagnostics.peak = localPeak;
    sessionDiagnostics.sumSquares = localSumSquares;
    sessionDiagnostics.clippedSamples = localClippedSamples;
    sessionDiagnostics.nonTrivialSamples = localNonTrivialSamples;

    const speechProbability = extractSpeechProbability(probabilities);
    if (speechProbability !== null) {
        sessionDiagnostics.speechProbabilitySamples += 1;
        sessionDiagnostics.speechProbabilitySum += speechProbability;
        sessionDiagnostics.maxSpeechProbability = sessionDiagnostics.maxSpeechProbability === null
            ? speechProbability
            : Math.max(sessionDiagnostics.maxSpeechProbability, speechProbability);
        sessionDiagnostics.minSpeechProbability = sessionDiagnostics.minSpeechProbability === null
            ? speechProbability
            : Math.min(sessionDiagnostics.minSpeechProbability, speechProbability);
    }
}

function formatDbfs(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return '-inf dBFS';
    }

    return `${(20 * Math.log10(value)).toFixed(1)} dBFS`;
}

function buildSessionSummary(totalSamples) {
    const durationSeconds = totalSamples / 16000;
    const rms = sessionDiagnostics.samplesCaptured > 0
        ? Math.sqrt(sessionDiagnostics.sumSquares / sessionDiagnostics.samplesCaptured)
        : 0;
    const activeSampleRatio = sessionDiagnostics.samplesCaptured > 0
        ? sessionDiagnostics.nonTrivialSamples / sessionDiagnostics.samplesCaptured
        : 0;
    const averageSpeechProbability = sessionDiagnostics.speechProbabilitySamples > 0
        ? sessionDiagnostics.speechProbabilitySum / sessionDiagnostics.speechProbabilitySamples
        : null;

    return {
        sessionId: sessionDiagnostics.sessionId,
        durationSeconds,
        framesCaptured: sessionDiagnostics.framesCaptured,
        samplesCaptured: sessionDiagnostics.samplesCaptured,
        rms,
        peak: sessionDiagnostics.peak,
        clippedSamples: sessionDiagnostics.clippedSamples,
        activeSampleRatio,
        speechStarts: sessionDiagnostics.speechStarts,
        speechEnds: sessionDiagnostics.speechEnds,
        misfires: sessionDiagnostics.misfires,
        averageSpeechProbability,
        maxSpeechProbability: sessionDiagnostics.maxSpeechProbability,
        minSpeechProbability: sessionDiagnostics.minSpeechProbability,
        elapsedMs: sessionDiagnostics.startedAt ? (Date.now() - sessionDiagnostics.startedAt) : 0
    };
}

function logSessionSummary(summary) {
    const speechProbabilityText = summary.averageSpeechProbability === null
        ? 'n/a'
        : `${summary.averageSpeechProbability.toFixed(3)} avg (${summary.minSpeechProbability?.toFixed(3)}-${summary.maxSpeechProbability?.toFixed(3)})`;

    window.api?.log?.(
        `[Audio] Session ${summary.sessionId} summary: duration=${summary.durationSeconds.toFixed(2)}s, frames=${summary.framesCaptured}, ` +
        `samples=${summary.samplesCaptured}, rms=${formatDbfs(summary.rms)}, peak=${summary.peak.toFixed(3)}, ` +
        `active=${(summary.activeSampleRatio * 100).toFixed(1)}%, clipped=${summary.clippedSamples}, ` +
        `speechStarts=${summary.speechStarts}, speechEnds=${summary.speechEnds}, misfires=${summary.misfires}, ` +
        `speechProb=${speechProbabilityText}, elapsed=${summary.elapsedMs}ms`
    );

    if (summary.rms < 0.01 || summary.activeSampleRatio < 0.05) {
        window.api?.log?.(
            `[Audio] Session ${summary.sessionId} looks low-signal. Whisper may hallucinate short stock phrases when audio is quiet or the wrong input is selected.`
        );
    }
}

function logActiveVadRuntime(sessionId) {
    if (!vad || typeof vad.getAudioInstances !== 'function') {
        return;
    }

    try {
        const { stream, audioContext } = vad.getAudioInstances();
        const track = stream?.getAudioTracks?.()[0];
        const trackSettings = sanitizeTrackSettings(track?.getSettings?.() || {});
        window.api?.log?.(
            `[Audio] Session ${sessionId} runtime: processor=${vad._audioProcessorAdapterType || 'unknown'}, ` +
            `audioContextSampleRate=${audioContext?.sampleRate || 'n/a'}, audioContextState=${audioContext?.state || 'n/a'}, ` +
            `trackLabel=${track?.label || '(label unavailable)'}, trackSettings=${JSON.stringify(trackSettings)}`
        );
    } catch (error) {
        window.api?.log?.(`[Audio] Failed to inspect active VAD runtime for session ${sessionId}: ${error.message}`);
    }
}

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
    attachDeviceChangeLogging();

    try {
        const VADClass = await loadVAD();
        vad = await VADClass.new({
            positiveSpeechThreshold: 0.5,
            minSpeechFrames: 3,
            startOnLoad: false,
            baseAssetPath: basePath,
            onnxWASMBasePath: basePath,
            getStream: () => openMicStream('Opening microphone stream'),
            resumeStream: () => openMicStream('Resuming microphone stream'),
            pauseStream: async (stream) => {
                logStreamDiagnostics(stream, 'Pausing microphone stream');
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            },

            onFrameProcessed: (probabilities, frame) => {
                if (!isListening || !frame || frame.length === 0) {
                    return;
                }

                recordingFrames.push(new Float32Array(frame));
                recordFrameDiagnostics(frame, probabilities);
            },

            onSpeechStart: () => {
                sessionDiagnostics.speechStarts += 1;
                window.api?.log?.(`VAD: Speech started (session ${currentSessionId})`);
            },

            onSpeechEnd: () => {
                sessionDiagnostics.speechEnds += 1;
                window.api?.log?.(`VAD: Speech ended (session ${currentSessionId})`);
            },

            onVADMisfire: () => {
                sessionDiagnostics.misfires += 1;
                window.api?.log?.(`VAD: Misfire (session ${currentSessionId}, speech too short)`);
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
    resetSessionDiagnostics(currentSessionId);
    isListening = true;
    await vad.start();
    window.api?.log?.(`VAD: Listening started for session ${currentSessionId}.`);
    logActiveVadRuntime(currentSessionId);
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
        window.api?.log?.(`[Audio] Session ${finalSessionId} ended without captured speech frames.`);
        resetSessionDiagnostics();
        currentSessionId = null;
        return false;
    }

    const totalLength = recordingFrames.reduce((sum, frame) => sum + frame.length, 0);
    if (totalLength === 0) {
        recordingFrames = [];
        window.api?.log?.(`[Audio] Session ${finalSessionId} produced zero total samples after merge.`);
        resetSessionDiagnostics();
        currentSessionId = null;
        return false;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const frame of recordingFrames) {
        merged.set(frame, offset);
        offset += frame.length;
    }

    const summary = buildSessionSummary(totalLength);
    logSessionSummary(summary);

    recordingFrames = [];
    resetSessionDiagnostics();
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
