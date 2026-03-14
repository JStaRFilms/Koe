export interface TranscriptionResult {
    rawText: string;
    refinedText: string;
    empty?: boolean;
}

export interface ProviderOptions {
    apiKey: string;
    language?: string;
    model?: string;
    enhanceText?: boolean;
    promptStyle?: string;
    customPrompt?: string;
    onStage?: (stage: { stage: string; label: string; progress?: number }) => void;
}

export interface TranscriptionProvider {
    transcribeSegment(audioBuffer: any, options: ProviderOptions): Promise<string>;
    refineTranscript(text: string, options: ProviderOptions): Promise<string>;
    validateApiKey(apiKey: string): Promise<boolean>;
}
