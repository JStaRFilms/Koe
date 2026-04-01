import { initVAD, startListening, stopListening, isVADReady, subscribeAudioLevels, subscribeRecorderWarnings } from './audio/vad.js';
import { PillUI } from './components/pill-ui.js';

let isRecording = false;
let activeSessionId = 0;
let pill;
let vadInitFailed = false;

function formatRetryShortcut() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    return isMac ? 'Cmd + Shift + ,' : 'Ctrl + Shift + ,';
}

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
        detail: payload?.detail,
        progress: payload?.progress,
        sessionId: payload?.sessionId ?? activeSessionId,
        error: payload?.error,
        retryAvailable: payload?.retryAvailable === true,
        forceDisplay: payload?.forceDisplay === true,
        lingerMs: payload?.lingerMs
    };
}

function compactPillLabel(stage, label) {
    const rawLabel = String(label || '').trim();
    if (!rawLabel) {
        if (stage === 'retrying') return 'Retrying';
        if (stage === 'uploading') return 'Uploading';
        if (stage === 'refining' || stage === 'enhancing') return 'Refining';
        return 'Transcribing';
    }

    const simplifiedMap = new Map([
        ['retrying failed audio', 'Retrying'],
        ['retrying saved transcript', 'Retrying'],
        ['retrying latest transcript', 'Retrying'],
        ['uploading audio', 'Uploading'],
        ['polishing transcription', 'Refining']
    ]);

    const normalized = rawLabel.toLowerCase();
    if (simplifiedMap.has(normalized)) {
        return simplifiedMap.get(normalized);
    }

    if (normalized.includes('retry')) {
        return 'Retrying';
    }
    if (normalized.includes('upload')) {
        return 'Uploading';
    }
    if (normalized.includes('refin') || normalized.includes('enhanc') || normalized.includes('polish')) {
        return 'Refining';
    }
    if (normalized.includes('transcrib') || normalized.includes('process')) {
        return 'Transcribing';
    }

    return rawLabel.length > 18 ? `${rawLabel.slice(0, 17).trimEnd()}...` : rawLabel;
}

function buildRetryDetail(detail = '') {
    const baseDetail = String(detail || '').trim();
    const hint = `Press ${formatRetryShortcut()} to retry.`;

    if (!baseDetail) {
        return hint;
    }

    if (baseDetail.toLowerCase().includes('press ')) {
        return baseDetail;
    }

    return `${baseDetail} ${hint}`;
}

async function init() {
    pill = new PillUI();
    subscribeAudioLevels((levels) => {
        pill.setVoiceLevels(levels);
    });
    subscribeRecorderWarnings((message) => {
        if (isRecording) {
            pill.setDetail(message || '');
        }
    });

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
            pill.setProcessingStatus('Finalizing', 18, recordingPayload.sessionId);

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

    if (window.api.onTranscriptionPreview) {
        window.api.onTranscriptionPreview((payload) => {
            if (!payload || payload.sessionId !== activeSessionId || !isRecording) {
                return;
            }

            pill.setStreamingDetail(payload.text || '');
        });
    }

    if (window.api.onTranscriptionStatus) {
        window.api.onTranscriptionStatus((payload) => {
            const status = normalizeStatusPayload(payload);

            if (typeof payload === 'string' && payload.startsWith('error:')) {
                const errorDetail = payload.replace('error:', '').trim();
                pill.setError(getErrorLabel(errorDetail), status.sessionId);
                window.api.log(`Transcription error surfaced to UI: ${errorDetail}`);
                return;
            }

            if (status.forceDisplay && status.sessionId != null && status.sessionId !== activeSessionId) {
                activeSessionId = status.sessionId;
                pill.beginSession(activeSessionId);
            }

            if (!status.forceDisplay && status.sessionId !== activeSessionId) {
                return;
            }

            if (status.stage === 'warning') {
                if (isRecording) {
                    pill.setDetail(status.detail || status.label || '');
                }
            } else if (isRecording && !status.forceDisplay) {
                return;
            } else if (status.stage === 'retrying') {
                pill.setProcessingStatus(
                    compactPillLabel(status.stage, status.label),
                    status.progress ?? 8,
                    status.sessionId,
                    status.detail || ''
                );
            } else if (status.stage === 'uploading') {
                pill.setProcessingStatus(
                    compactPillLabel(status.stage, status.label),
                    status.progress ?? 16,
                    status.sessionId,
                    status.detail || ''
                );
            } else if (status.stage === 'transcribing' || status.stage === 'processing') {
                pill.setProcessingStatus(
                    status.label || 'Finalizing',
                    status.progress ?? 20,
                    status.sessionId,
                    status.detail || ''
                );
            } else if (status.stage === 'refining' || status.stage === 'enhancing') {
                pill.setProcessingStatus(
                    compactPillLabel(status.stage, status.label),
                    status.progress ?? 72,
                    status.sessionId,
                    status.detail || ''
                );
            } else if (status.stage === 'empty') {
                pill.hideWithMessage(status.label || 'No speech detected', status.sessionId, status.detail || '');
            } else if (status.stage === 'error' || status.error) {
                const detail = status.retryAvailable
                    ? buildRetryDetail(status.detail || '')
                    : (status.detail || '');

                pill.setError(getErrorLabel(status.error || ''), status.sessionId, {
                    detail,
                    lingerMs: status.retryAvailable
                        ? Math.max(status.lingerMs || 0, 6500)
                        : status.lingerMs
                });
            }
        });
    }

    if (window.api.onTranscriptionComplete) {
        window.api.onTranscriptionComplete((payload) => {
            const completion = typeof payload === 'string'
                ? { text: payload, sessionId: activeSessionId, forceDisplay: false }
                : {
                    text: payload?.text,
                    sessionId: payload?.sessionId ?? activeSessionId,
                    forceDisplay: payload?.forceDisplay === true
                };

            if (completion.forceDisplay && completion.sessionId != null && completion.sessionId !== activeSessionId) {
                activeSessionId = completion.sessionId;
                pill.beginSession(activeSessionId);
            }

            if (!completion.forceDisplay && completion.sessionId !== activeSessionId) {
                return;
            }

            if (completion.text) {
                pill.showDoneAndHide(completion.sessionId);
            } else {
                pill.hideWithMessage('Done', completion.sessionId);
            }
        });
    }

    const pillElement = document.getElementById('pill');
    if (pillElement) {
        pillElement.addEventListener('click', () => {
            if (window.api && window.api.toggleRecording) {
                window.api.toggleRecording();
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
