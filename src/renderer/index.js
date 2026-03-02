import { initVAD, startListening, stopListening } from './audio/vad.js';
import { FloatingWindow } from './components/floating-window.js';
import { SettingsPanel } from './components/settings-panel.js';

let isRecording = false;
let ui;
let settingsUI;

// Initialize app
async function init() {
    ui = new FloatingWindow();
    ui.setState('idle');

    settingsUI = new SettingsPanel();

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            settingsUI.show();
        });
    }

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
                    // MicVAD handles mic access + speech detection internally
                    await startListening();
                } else {
                    stopListening();
                }
            } catch (err) {
                isRecording = false;
                updateUI();
                window.api.log(`Failed to toggle recording: ${err.message}`);
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

        // Initial settings fetch and onboarding check
        const settings = await window.api.getSettings();
        window.api.log(`Loaded settings with hotkey: ${settings.hotkey}`);

        if (!settings.groqApiKey) {
            window.api.log('No API key found. Triggering first-launch settings panel.');
            settingsUI.show();
        }
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
