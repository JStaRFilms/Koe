const statusIndicator = document.getElementById('status-indicator');
const transcriptionText = document.getElementById('transcription-text');

let isRecording = false;

// Initialize app
async function init() {
    if (window.api) {
        window.api.log('Renderer successfully initialized.');

        // Listen for recording toggles from main process
        window.api.onRecordingToggle((recordingState) => {
            isRecording = recordingState;
            updateUI();
            // Debug
            window.api.log(`Recording toggled: ${isRecording}`);
        });

        // Test settings fetch
        const settings = await window.api.getSettings();
        window.api.log(`Loaded settings with hotkey: ${settings.hotkey}`);
    } else {
        console.warn('API bridge not found. Make sure Electron preload script is configured correctly.');
    }
}

function updateUI() {
    if (isRecording) {
        statusIndicator.classList.add('recording');
        transcriptionText.classList.remove('placeholder');
        transcriptionText.textContent = "Recording...";
    } else {
        statusIndicator.classList.remove('recording');
        transcriptionText.classList.add('placeholder');
        transcriptionText.textContent = "Waiting to start...";
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
