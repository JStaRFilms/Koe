import { initVAD, startListening, stopListening, isVADReady } from './audio/vad.js';
import { PillUI } from './components/pill-ui.js';

let isRecording = false;
let pill;
let vadInitFailed = false;

/**
 * Parse an error message into a short, user-friendly label.
 */
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

async function init() {
    pill = new PillUI();

    if (!window.api) {
        console.warn('API bridge not found. Preload script may not be configured.');
        return;
    }

    window.api.log('Renderer initialized — pill mode.');

    // Initialize VAD in the background
    try {
        await initVAD();
    } catch (e) {
        vadInitFailed = true;
        window.api.log(`VAD init error: ${e.message}`);
    }

    // ─── Animate-in event from main process ───
    window.api.onAnimateIn(() => {
        pill.animateIn();
    });

    // ─── Recording toggle from hotkey / tray ───
    window.api.onRecordingToggle(async (recordingState) => {
        if (recordingState) {
            // Check if VAD is ready before recording
            if (vadInitFailed || !isVADReady()) {
                isRecording = false;
                pill.setError('Audio Not Ready');
                window.api.log('Recording attempted but VAD not initialized.');
                return;
            }
            isRecording = true;
            pill.setState('recording');
        } else {
            // If we weren't actually recording (e.g. VAD rejected the start),
            // don't enter processing state — just ignore.
            if (!isRecording) {
                window.api.log('Stop toggle received but was not recording. Ignoring.');
                return;
            }
            isRecording = false;
            // Stop recording → show processing state while waiting for transcription
            pill.setState('processing');
        }

        try {
            if (isRecording) {
                await startListening();
            } else {
                stopListening();
            }
        } catch (err) {
            isRecording = false;
            pill.setError(getErrorLabel(err.message));
            window.api.log(`Toggle recording error: ${err.message}`);
        }

        window.api.log(`Recording toggled: ${isRecording}`);
    });

    // ─── Transcription status updates ───
    if (window.api.onTranscriptionStatus) {
        window.api.onTranscriptionStatus((status) => {
            if (status === 'processing' || status === 'enhancing') {
                pill.setState('processing');
            } else if (status && typeof status === 'string' && status.startsWith('error:')) {
                // Parse the error and show a user-friendly label
                const errorDetail = status.replace('error:', '').trim();
                pill.setError(getErrorLabel(errorDetail));
                window.api.log(`Transcription error surfaced to UI: ${errorDetail}`);
            }
        });
    }

    // ─── Transcription complete: auto-paste happened, show done & hide ───
    if (window.api.onTranscriptionComplete) {
        window.api.onTranscriptionComplete((text) => {
            if (text) {
                pill.showDoneAndHide();
            }
        });
    }

    // ─── First-launch: check for API key ───
    const settings = await window.api.getSettings();
    window.api.log(`Loaded settings. Hotkey: ${settings.hotkey}`);

    if (!settings.groqApiKey) {
        window.api.log('No API key found. User should configure via system tray → Settings.');
    }
}

document.addEventListener('DOMContentLoaded', init);

