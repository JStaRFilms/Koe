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

    // Settings Window
    OPEN_SETTINGS_WINDOW: 'window:open-settings-window',
    CLOSE_SETTINGS_WINDOW: 'window:close-settings-window',
    OPEN_SETTINGS_TAB: 'tab:open-settings',
    OPEN_HISTORY_TAB: 'tab:open-history',
    OPEN_USAGE_TAB: 'tab:open-usage'
};

const DEFAULT_CUSTOM_PROMPT = "Refine the user's text by looking at the text and context, and convey the same message in the smoothest, clearest way possible while keeping the original tone. Do not rewrite it from scratch. Do not turn it into corporate-speak. Never use em dashes anywhere in the output. Do not add any wrapper tags or markup like <transcript> or </transcript>. Remove filler words only when they are clearly speech filler. Keep them if the user is actually talking about the words themselves or using them in a technical context. If the text is technical or code-related, keep the terminology precise. Make the smallest changes needed. Return only the refined text.";

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
    cloudProcessingEnabled: false,
    cloudProcessingUrl: ''
};

module.exports = {
    CHANNELS,
    DEFAULT_CUSTOM_PROMPT,
    DEFAULT_SETTINGS
};
