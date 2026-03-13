import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type PermissionResponse,
  type RecordingOptions,
} from 'expo-audio';

export interface CompletedRecording {
  uri: string | null;
  durationMillis: number;
}

export const DEFAULT_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX,
  },
  web: {
    ...RecordingPresets.HIGH_QUALITY.web,
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export async function requestMicrophonePermission(): Promise<PermissionResponse> {
  return requestRecordingPermissionsAsync();
}

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    allowsBackgroundRecording: true,
    interruptionMode: 'doNotMix',
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    shouldRouteThroughEarpiece: false,
  });
}

export async function resetRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    allowsBackgroundRecording: false,
    interruptionMode: 'mixWithOthers',
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });
}

export async function startRecorder(recorder: AudioRecorder): Promise<void> {
  await configureRecordingAudioMode();
  await recorder.prepareToRecordAsync(DEFAULT_RECORDING_OPTIONS);
  recorder.record();
}

export async function stopRecorder(recorder: AudioRecorder): Promise<CompletedRecording> {
  await recorder.stop();
  const state = recorder.getStatus();
  await resetRecordingAudioMode();

  return {
    uri: recorder.uri ?? state.url,
    durationMillis: state.durationMillis,
  };
}

export async function cancelRecorder(recorder: AudioRecorder): Promise<void> {
  const state = recorder.getStatus();

  if (state.isRecording) {
    await recorder.stop();
  }

  await resetRecordingAudioMode();
}
