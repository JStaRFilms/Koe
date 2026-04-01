const { DEFAULT_CUSTOM_PROMPT } = require('@koe/core');

const CHANNELS = {
    // Main -> Renderer
    RECORDING_TOGGLED: 'recording:toggled',
    USAGE_STATS: 'app:usage-stats',
    TRANSCRIPTION_RESULT: 'transcription:result',
    TRANSCRIPTION_STATUS: 'transcription:status',
    TRANSCRIPTION_COMPLETE: 'transcription:complete',
    TRANSCRIPTION_PREVIEW: 'transcription:preview',
    WINDOW_ANIMATE_IN: 'window:animate-in',
    MEETING_DETECTED: 'meeting:detected',

    // Renderer -> Main
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    GET_USAGE_STATS: 'app:get-usage-stats',
    LOG: 'app:log',
    AUDIO_SEGMENT: 'audio:segment',
    AUDIO_SESSION_STOPPED: 'audio:session-stopped',
    TOGGLE_RECORDING: 'recording:toggle',
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_HIDE: 'window:hide',
    TEST_GROQ_KEY: 'settings:test-key',
    OPEN_SETTINGS: 'window:open-settings',
    GET_HISTORY: 'history:get',
    CLEAR_HISTORY: 'history:clear',
    RETRY_HISTORY_ENTRY: 'history:retry-entry',
    RETRY_LAST_TRANSCRIPT: 'history:retry-last',

    // Settings Window
    OPEN_SETTINGS_WINDOW: 'window:open-settings-window',
    CLOSE_SETTINGS_WINDOW: 'window:close-settings-window',
    OPEN_SETTINGS_TAB: 'tab:open-settings',
    OPEN_HISTORY_TAB: 'tab:open-history',
    OPEN_USAGE_TAB: 'tab:open-usage'
};

const DEFAULT_SETTINGS = {
    groqApiKey: '',
    hotkey: 'Alt+Shift+S',
    language: 'auto',
    enhanceText: true,
    autoPaste: true,
    launchOnStartup: true,
    autoUpdate: true,
    theme: 'dark',
    promptStyle: 'Clean',
    customPrompt: DEFAULT_CUSTOM_PROMPT,
    model: 'whisper-large-v3-turbo',
    cloudProcessingEnabled: false,
    cloudProcessingUrl: '',
    userEmail: '',
    sendEmailSummaries: true
};

module.exports = {
    CHANNELS,
    DEFAULT_CUSTOM_PROMPT,
    DEFAULT_SETTINGS
};
