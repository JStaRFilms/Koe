import { initVAD, startListening, stopListening } from './audio/vad.js';
import { PillUI } from './components/pill-ui.js';

let isRecording = false;
let pill;

async function init() {
    pill = new PillUI();

    if (!window.api) {
        console.warn('API bridge not found. Preload script may not be configured.');
        return;
    }

    window.api.log('Renderer initialized — pill mode.');

    // Initialize VAD in the background
    initVAD().catch(e => window.api.log(`VAD init error: ${e.message}`));

    // ─── Animate-in event from main process ───
    window.api.onAnimateIn(() => {
        pill.animateIn();
    });

    // ─── Recording toggle from hotkey / tray ───
    window.api.onRecordingToggle(async (recordingState) => {
        isRecording = recordingState;

        if (isRecording) {
            pill.setState('recording');
        } else {
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
            pill.setState('idle');
            window.api.log(`Toggle recording error: ${err.message}`);
        }

        window.api.log(`Recording toggled: ${isRecording}`);
    });

    // ─── Transcription status updates ───
    if (window.api.onTranscriptionStatus) {
        window.api.onTranscriptionStatus((status) => {
            if (status === 'processing' || status === 'enhancing') {
                pill.setState('processing');
            } else if (status.startsWith && status.startsWith('error:')) {
                // On error, briefly show error then hide
                pill.setState('idle');
                setTimeout(() => pill.animateOut(), 2000);
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
