import { startCapture, stopCapture } from './audio/mic-capture.js';
import { initVAD } from './audio/vad.js';
import { FloatingWindow } from './components/floating-window.js';

let isRecording = false;
let ui;

// Initialize app
async function init() {
    ui = new FloatingWindow();
    ui.setState('idle');

    if (window.api) {
        window.api.log('Renderer successfully initialized.');

        // Initialize VAD model locally in the background
        initVAD().catch(e => window.api.log(`VAD initialization error: ${e.message}`));

        // Listen for recording toggles from main process
        window.api.onRecordingToggle(async (recordingState) => {
            isRecording = recordingState;
            updateUI();

            try {
                if (isRecording) {
                    await startCapture();
                } else {
                    stopCapture();
                }
            } catch (err) {
                isRecording = false;
                updateUI();
                window.api.log(`Failed to toggle mic capture: ${err.message}`);
            }

            // Debug
            window.api.log(`Recording toggled: ${isRecording}`);
        });

        // Listen for transcription results from main process if there is a way
        // (Assuming standard implementation that matches groq integration context)
        if (window.api.onTranscriptionResult) {
            window.api.onTranscriptionResult((result) => {
                if (result && result.text) {
                    ui.appendTranscription(result.text, true);
                }
            });
        }

        // Listen for processing status updates (if available)
        if (window.api.onTranscriptionStatus) {
            window.api.onTranscriptionStatus((status) => {
                // status: 'processing', 'done', 'error'
                if (status === 'processing') {
                    ui.setState('processing');
                } else if (status === 'done' || status === 'error') {
                    // Revert to recording state if we are still capturing
                    ui.setState(isRecording ? 'recording' : 'idle');
                }
            });
        }

        // Test settings fetch
        const settings = await window.api.getSettings();
        window.api.log(`Loaded settings with hotkey: ${settings.hotkey}`);
    } else {
        console.warn('API bridge not found. Make sure Electron preload script is configured correctly.');
    }
}

function updateUI() {
    if (isRecording) {
        ui.setState('recording');
    } else {
        ui.setState('idle');
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
