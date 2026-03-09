const CHANNELS = {
    // Main -> Renderer
    RECORDING_TOGGLED: 'recording:toggled',
    USAGE_STATS: 'app:usage-stats',
    TRANSCRIPTION_RESULT: 'transcription:result',
    TRANSCRIPTION_STATUS: 'transcription:status',
    TRANSCRIPTION_COMPLETE: 'transcription:complete',
    WINDOW_ANIMATE_IN: 'window:animate-in',

    // Renderer -> Main
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    GET_USAGE_STATS: 'app:get-usage-stats',
    LOG: 'app:log',
    AUDIO_CHUNK: 'audio:chunk',
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_HIDE: 'window:hide',
    TEST_GROQ_KEY: 'settings:test-key',
    OPEN_SETTINGS: 'window:open-settings',
    GET_HISTORY: 'history:get',
    CLEAR_HISTORY: 'history:clear',

    // Settings Window
    OPEN_SETTINGS_WINDOW: 'window:open-settings-window',
    CLOSE_SETTINGS_WINDOW: 'window:close-settings-window',
    OPEN_SETTINGS_TAB: 'tab:open-settings',
    OPEN_HISTORY_TAB: 'tab:open-history',
    OPEN_USAGE_TAB: 'tab:open-usage'
};

const DEFAULT_CUSTOM_PROMPT = "You are a refinement layer, not the author. Refine the user's text using the text and context so the message lands as clearly and smoothly as possible while keeping the original tone. Do not rewrite it from scratch. Do not turn it into corporate-speak. Keep the voice, intent, and phrasing style intact. Do not use em dashes. If the text is technical or code-related, keep the terminology precise. Make the smallest changes needed. Return only the refined text.";

const DEFAULT_SETTINGS = {
    groqApiKey: '',
    hotkey: 'CommandOrControl+Shift+Space',
    language: 'auto',
    enhanceText: true,
    autoPaste: true, // Now default true — pill auto-pastes
    theme: 'dark',
    promptStyle: 'Clean',
    customPrompt: DEFAULT_CUSTOM_PROMPT,
    model: 'whisper-large-v3-turbo' // 'whisper-large-v3-turbo' (fast) or 'whisper-large-v3' (accurate)
};

module.exports = {
    CHANNELS,
    DEFAULT_CUSTOM_PROMPT,
    DEFAULT_SETTINGS
};
