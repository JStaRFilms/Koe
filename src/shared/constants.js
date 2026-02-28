const CHANNELS = {
    // Main -> Renderer
    RECORDING_TOGGLED: 'recording:toggled',

    // Renderer -> Main
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    LOG: 'app:log'
};

const DEFAULT_SETTINGS = {
    groqApiKey: '',
    hotkey: 'CommandOrControl+Shift+Space',
    language: 'auto',
    enhanceText: true,
    autoPaste: false,
    theme: 'dark'
};

module.exports = {
    CHANNELS,
    DEFAULT_SETTINGS
};
