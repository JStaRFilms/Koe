/**
 * Shared Text Manipulation Utils
 */

export function joinTranscriptParts(parts: (string | null | undefined)[]): string {
    return parts
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+([,.;!?])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

export function safeAudioSeconds(value: any): number {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric : 0;
}

export function sanitizeRefinedText(text: string | null | undefined): string {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/<\/?\s*transcript\s*>/gi, '')
        .replace(/\s*[\u2013\u2014]\s*/g, ', ')
        .replace(/[ \t]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
