export interface KoeSettings {
    groqApiKey: string;
    language: string;
    promptStyle: string;
    customPrompt: string;
    model: string;
    enhanceText: boolean;
    autoPaste: boolean;
    cloudProcessingEnabled?: boolean;
    cloudProcessingUrl?: string;
}

export const DEFAULT_SETTINGS: KoeSettings = {
    groqApiKey: '',
    language: 'auto',
    promptStyle: 'Clean',
    customPrompt: '', // Will be resolved to DEFAULT_CUSTOM_PROMPT if empty
    model: 'whisper-large-v3-turbo',
    enhanceText: true,
    autoPaste: true,
    cloudProcessingEnabled: false,
    cloudProcessingUrl: ''
};
