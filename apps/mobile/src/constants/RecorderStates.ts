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
    headline: 'Ready when you are',
    description: 'Manual start and stop recording is active. Tap to begin dictation.',
    detail: 'Your transcript will be refined by AI and copied to the clipboard automatically.',
    actionLabel: 'Tap to record',
    toneColor: Colors.dark.accent,
    ringColor: Colors.dark.accentGlow,
  },
  recording: {
    headline: 'Listening...',
    description: 'Koe is capturing your voice. Speak clearly for best results.',
    detail: 'Tap again to stop. Recording is interruption-safe and stored locally.',
    actionLabel: 'Stop and process',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
  processing: {
    headline: 'Refining thoughts',
    description: 'AI is transcribing and polishing your speech into perfect text.',
    detail: 'This favors quality and reliability. Work remains on-device until sent to Groq.',
    actionLabel: 'Processing...',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  copied: {
    headline: 'Ready to paste',
    description: 'Your refined transcript has been copied to the clipboard.',
    detail: 'Switch to any app and paste. The transient recording has been cleared.',
    actionLabel: 'Record again',
    toneColor: Colors.dark.success,
    ringColor: Colors.dark.successGlow,
  },
  empty: {
    headline: 'Nothing found',
    description: 'The recording finished, but no speech was detected.',
    detail: 'Try speaking closer to the microphone or in a quieter environment.',
    actionLabel: 'Try again',
    toneColor: Colors.dark.process,
    ringColor: Colors.dark.processGlow,
  },
  error: {
    headline: 'Recovery available',
    description: 'Koe preserved your last recording after a processing failure.',
    detail: 'You can retry the refinement or discard it and start fresh.',
    actionLabel: 'Retry recording',
    toneColor: Colors.dark.danger,
    ringColor: Colors.dark.dangerGlow,
  },
};
