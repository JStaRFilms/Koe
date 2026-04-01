import { DEFAULT_CUSTOM_PROMPT } from '../constants';

/**
 * Resolves the prompt to use for AI enhancement based on the selected style.
 */
export function resolveEnhancementPrompt(promptStyle: string = 'Clean', customPrompt: string = '', smartContext: string = ''): string {
    const contextPrefix = smartContext ? `Context: ${smartContext}. ` : '';
    const trimmedPrompt = customPrompt.trim();
    if (trimmedPrompt) {
        return trimmedPrompt;
    }

    if (promptStyle === 'Professional' || promptStyle === 'Formal') {
        return contextPrefix + 'Refine this dictated text with a formal, professional tone. Keep the meaning intact, fix punctuation and grammar, remove filler only when it is clearly filler, never use em dashes, and do not add transcript tags or any other wrapper markup.';
    }

    if (promptStyle === 'Casual') {
        return contextPrefix + 'Refine this dictated text so it stays casual and conversational. Keep the meaning intact, fix punctuation and grammar, remove filler only when it is clearly filler, never use em dashes, and do not add transcript tags or any other wrapper markup.';
    }

    if (promptStyle === 'Concise' || promptStyle === 'Bullets') {
        return contextPrefix + 'Refine this dictated text into a tighter version with less filler while keeping the original meaning. Remove filler words like um, uh, and obvious filler mistranscriptions like ohms only when they are clearly filler, not when they are literal or technical. Never use em dashes, and do not add transcript tags or any other wrapper markup.';
    }

    if (promptStyle === 'Meeting Notes' || promptStyle === 'Meeting') {
        return contextPrefix + 'Refine this meeting transcript into a structured set of meeting notes. Include a summary of the main points and a clear list of action items with owners if mentioned. Maintain a professional tone and ensure the output is concise and actionable.';
    }

    return contextPrefix + DEFAULT_CUSTOM_PROMPT;
}

export function parseErrorMessage(payload: any, fallback: string): string {
    if (!payload) {
        return fallback;
    }

    if (typeof payload === 'string') {
        return payload;
    }

    return payload.error?.message || payload.error || payload.message || fallback;
}
