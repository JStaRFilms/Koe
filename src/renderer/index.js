import { initVAD, startListening, stopListening, isVADReady } from './audio/vad.js';
import { PillUI } from './components/pill-ui.js';

let isRecording = false;
let activeSessionId = 0;
let pill;
let vadInitFailed = false;

function getErrorLabel(errorMsg) {
    const msg = (errorMsg || '').toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('enotfound') || msg.includes('timeout')) {
        return 'Network Error';
    }
    if (msg.includes('401') || msg.includes('403') || msg.includes('api key') || msg.includes('unauthorized')) {
        return 'API Key Invalid';
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
        return 'Rate Limited';
    }
    if (msg.includes('500') || msg.includes('server')) {
        return 'Server Error';
    }
    if (msg.includes('vad') || msg.includes('backend') || msg.includes('wasm')) {
        return 'Audio Engine Failed';
    }
    return 'Transcription Error';
}

function normalizeRecordingPayload(payload) {
    if (typeof payload === 'boolean') {
        return { isRecording: payload, sessionId: activeSessionId };
    }

    return {
        isRecording: !!payload?.isRecording,
        sessionId: payload?.sessionId ?? activeSessionId
    };
}

function normalizeStatusPayload(payload) {
    if (typeof payload === 'string') {
        return { stage: payload, sessionId: activeSessionId };
    }

    return {
        stage: payload?.stage,
        label: payload?.label,
        progress: payload?.progress,
        sessionId: payload?.sessionId ?? activeSessionId,
        error: payload?.error
    };
}

async function init() {
    pill = new PillUI();

    if (!window.api) {
        console.warn('API bridge not found. Preload script may not be configured.');
        return;
    }

    window.api.log('Renderer initialized in pill mode.');

    try {
        await initVAD();
    } catch (e) {
        vadInitFailed = true;
        window.api.log(`VAD init error: ${e.message}`);
    }

    window.api.onAnimateIn(() => {
        pill.animateIn();
    });

    window.api.onRecordingToggle(async (payload) => {
        const recordingPayload = normalizeRecordingPayload(payload);

        if (recordingPayload.isRecording) {
            if (vadInitFailed || !isVADReady()) {
                isRecording = false;
                pill.setError('Audio Not Ready', recordingPayload.sessionId);
                window.api.log('Recording attempted but VAD was not ready.');
                return;
            }

            activeSessionId = recordingPayload.sessionId;
            isRecording = true;
            pill.beginSession(activeSessionId);
            pill.setState('recording');

            try {
                await startListening(activeSessionId);
            } catch (err) {
                isRecording = false;
                pill.setError(getErrorLabel(err.message), activeSessionId);
                window.api.log(`Start recording error: ${err.message}`);
                return;
            }
        } else {
            if (!isRecording) {
                window.api.log('Stop toggle received while not recording. Ignoring.');
                return;
            }

            isRecording = false;
            pill.setProcessingStatus('Uploading', 12, recordingPayload.sessionId);

            try {
                const didCaptureAudio = stopListening(recordingPayload.sessionId);
                if (!didCaptureAudio) {
                    pill.hideWithMessage('Nothing captured', recordingPayload.sessionId);
                }
            } catch (err) {
                pill.setError(getErrorLabel(err.message), recordingPayload.sessionId);
                window.api.log(`Stop recording error: ${err.message}`);
            }
        }

        window.api.log(`Recording toggled: ${recordingPayload.isRecording} (session ${recordingPayload.sessionId})`);
    });

    if (window.api.onTranscriptionStatus) {
        window.api.onTranscriptionStatus((payload) => {
            const status = normalizeStatusPayload(payload);

            if (typeof payload === 'string' && payload.startsWith('error:')) {
                const errorDetail = payload.replace('error:', '').trim();
                pill.setError(getErrorLabel(errorDetail), status.sessionId);
                window.api.log(`Transcription error surfaced to UI: ${errorDetail}`);
                return;
            }

            if (status.sessionId !== activeSessionId) {
                return;
            }

            if (status.stage === 'uploading') {
                pill.setProcessingStatus(status.label || 'Uploading', status.progress ?? 16, status.sessionId);
            } else if (status.stage === 'transcribing' || status.stage === 'processing') {
                pill.setProcessingStatus(status.label || 'Transcribing', status.progress ?? 20, status.sessionId);
            } else if (status.stage === 'refining' || status.stage === 'enhancing') {
                pill.setProcessingStatus(status.label || 'Refining', status.progress ?? 72, status.sessionId);
            } else if (status.stage === 'empty') {
                pill.hideWithMessage(status.label || 'No speech detected', status.sessionId);
            } else if (status.stage === 'error' || status.error) {
                pill.setError(getErrorLabel(status.error || ''), status.sessionId);
            }
        });
    }

    if (window.api.onTranscriptionComplete) {
        window.api.onTranscriptionComplete((payload) => {
            const completion = typeof payload === 'string'
                ? { text: payload, sessionId: activeSessionId }
                : { text: payload?.text, sessionId: payload?.sessionId ?? activeSessionId };

            if (completion.sessionId !== activeSessionId) {
                return;
            }

            if (completion.text) {
                pill.showDoneAndHide(completion.sessionId);
            } else {
                pill.hideWithMessage('Done', completion.sessionId);
            }
        });
    }

    const settings = await window.api.getSettings();
    window.api.log(`Loaded settings. Hotkey: ${settings.hotkey}`);

    if (!settings.groqApiKey) {
        window.api.log('No API key found. User should configure it via the tray settings window.');
    }
}

document.addEventListener('DOMContentLoaded', init);
