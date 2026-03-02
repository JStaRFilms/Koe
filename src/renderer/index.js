import { initVAD, startListening, stopListening } from './audio/vad.js';
import { FloatingWindow } from './components/floating-window.js';
import { SettingsPanel } from './components/settings-panel.js';
import { HistoryPanel } from './components/history-panel.js';
import { UsageMeter } from './components/usage-meter.js';

let isRecording = false;
let ui;
let settingsUI;
let historyUI;
let usageUI;

// Initialize app
async function init() {
    ui = new FloatingWindow();
    ui.setState('idle');

    settingsUI = new SettingsPanel();
    historyUI = new HistoryPanel();
    usageUI = new UsageMeter();

    // Show usage meter by default if we have stats -> removed based on user feedback.
    usageUI.hide();

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            if (!settingsUI.panel.classList.contains('hide')) {
                settingsUI.hide();
            } else {
                settingsUI.show();
                historyUI.hide(); // Hide history if opening settings
                usageUI.hide(); // Also hide usage meter
            }
        });
    }

    const btnHistory = document.getElementById('btn-history');
    if (btnHistory) {
        btnHistory.addEventListener('click', () => {
            if (!historyUI.container.classList.contains('hide')) {
                historyUI.hide();
                usageUI.hide();
            } else {
                historyUI.show();
                usageUI.show(); // Show usage meter along with history
                settingsUI.hide(); // Hide settings if opening history
            }
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
                // status: 'processing', 'done', 'error', 'enhancing'
                if (status === 'processing' || status === 'enhancing') {
                    ui.setState('processing');
                } else if (status === 'done' || status === 'error' || status.startsWith('error:')) {
                    // Revert to recording state if we are still capturing
                    ui.setState(isRecording ? 'recording' : 'idle');
                }
            });
        }

        // Listen for Usage Stats updates
        if (window.api.onUsageStats) {
            window.api.onUsageStats((stats) => {
                usageUI.updateMeters(stats);
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
