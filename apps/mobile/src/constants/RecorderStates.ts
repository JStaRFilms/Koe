import { Colors } from './Theme';

export type ScreenStage = 'idle' | 'recording' | 'processing' | 'copied' | 'empty' | 'error';

export interface StateMeta {
  headline: string;
  description: string;
  detail: string;
  actionLabel: string;
  toneColor: string;
  ringColor: string;
}

export const RECORDER_STATES: Record<ScreenStage, StateMeta> = {
  idle: {
    headline: 'Ready',
    description: 'Tap once to start. Tap again when you are done.',
    detail: 'Tap to begin. Refined text copies to your clipboard automatically.',
    actionLabel: 'Tap to record',
    toneColor: Colors.dark.accent,
    ringColor: Colors.dark.accentGlow,
  },
  recording: {
    headline: 'Listening...',
    description: 'Koe is capturing your voice.',
    detail: 'Stay on this screen. Tap to stop and refine.',
    actionLabel: 'Stop and process',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
  processing: {
    headline: 'Refining...',
    description: 'Polishing your speech into text.',
    detail: 'Your spoken thoughts are now being held in a secure local buffer, isolated from the noise of the network while the first pass of refinement begins. We are measuring the cadence of your speech, stripping away the hesitation of filler words, and reconstructing your intent with surgical precision. This is more than transcription; it is the distillation of human thought into the perfect digital artifact. Our processors are navigating the architecture of your sentences, ensuring every comma and period lands with weight and purpose. Soon, this raw data will be transformed into polished text, ready to be delivered to your clipboard for instant use in any application. We value the friction-less transition from mind to machine. Please remain on this screen while we finalize the synthesis. Your voice is the primary input; our goal is to make it your most powerful tool. The connection to the inference engine is active, and the final layers of grammar and tone are being applied now. We are scrubbing for background artifacts, enhancing the natural flow of your narrative, and preparing the handoff to your system clipboard. In a world of fragmented focus, Koe aims to preserve the purity of your initial idea. This process involves multiple passes: first, the acoustic modeling captures the phonemes; second, the linguistic model identifies the structure; and finally, our refinement protocol polishes the prose for professional delivery. We are nearly through the final verification stage. Your terminal-noir environment is optimized for this specific frequency of thought. As the waveforms settle, we are performing a final coherence check against your selected style profile. This ensures the output is not just accurate, but tonally resonant. Every syllable has been accounted for, every pause analyzed for its semantic value. We are committed to the sovereignty of your data and the clarity of your expression. Ready for deployment. Refining complete. Preparing the final copy operation.',
    actionLabel: 'Processing...',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  copied: {
    headline: 'Text Copied',
    description: 'Refined transcript is in your clipboard.',
    detail: 'Paste anywhere. The temporary recording has been cleared.',
    actionLabel: 'Record again',
    toneColor: Colors.dark.success,
    ringColor: Colors.dark.successGlow,
  },
  empty: {
    headline: 'No speech detected',
    description: 'I did not catch any spoken words that time.',
    detail: 'Try again a little closer to the microphone.',
    actionLabel: 'Try again',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  error: {
    headline: 'Saved for retry',
    description: 'Something went wrong, but your last recording was kept.',
    detail: 'You can try again or discard it and start fresh.',
    actionLabel: 'Retry',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
};
