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

    // Renderer -> Main
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    GET_USAGE_STATS: 'app:get-usage-stats',
    LOG: 'app:log',
    AUDIO_SEGMENT: 'audio:segment',
    AUDIO_SESSION_STOPPED: 'audio:session-stopped',
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_HIDE: 'window:hide',
    TEST_GROQ_KEY: 'settings:test-key',
    OPEN_SETTINGS: 'window:open-settings',
    GET_HISTORY: 'history:get',
    CLEAR_HISTORY: 'history:clear',
    RETRY_HISTORY_ENTRY: 'history:retry-entry',
    RETRY_LAST_TRANSCRIPT: 'history:retry-last',
    GET_ACCOUNT_STATE: 'account:get-state',
    ACCOUNT_SIGN_UP: 'account:sign-up',
    ACCOUNT_SIGN_IN: 'account:sign-in',
    ACCOUNT_SIGN_OUT: 'account:sign-out',
    ACCOUNT_REQUEST_PASSWORD_RESET: 'account:request-password-reset',
    ACCOUNT_REQUEST_EMAIL_VERIFICATION: 'account:request-email-verification',
    ACCOUNT_SAVE_BYOK: 'account:save-byok',
    ACCOUNT_DELETE_BYOK: 'account:delete-byok',
    ACCOUNT_SET_MODE: 'account:set-mode',
    ACCOUNT_SAVE_SYNCED_SETTINGS: 'account:save-synced-settings',
    ACCOUNT_OPEN_WEB_BILLING: 'account:open-web-billing',

    // Settings Window
    OPEN_SETTINGS_WINDOW: 'window:open-settings-window',
    CLOSE_SETTINGS_WINDOW: 'window:close-settings-window',
    OPEN_SETTINGS_TAB: 'tab:open-settings',
    OPEN_HISTORY_TAB: 'tab:open-history',
    OPEN_USAGE_TAB: 'tab:open-usage'
};

const DEFAULT_SETTINGS = {
    groqApiKey: '',
    hotkey: 'CommandOrControl+Shift+Space',
    language: 'auto',
    enhanceText: true,
    autoPaste: true,
    launchOnStartup: true,
    autoUpdate: true,
    theme: 'dark',
    promptStyle: 'Clean',
    customPrompt: DEFAULT_CUSTOM_PROMPT,
    model: 'whisper-large-v3-turbo',
    accountApiUrl: ''
};

module.exports = {
    CHANNELS,
    DEFAULT_CUSTOM_PROMPT,
    DEFAULT_SETTINGS
};
