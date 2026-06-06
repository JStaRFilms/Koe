import { parseBlob } from "music-metadata";

function roundAudioSeconds(value: number) {
  return Math.max(1, Math.ceil(value));
}

function readWavDuration(bytes: Uint8Array) {
  if (bytes.byteLength < 44) {
    return null;
  }

  const text = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (!text.startsWith("RIFF") || !text.includes("WAVE")) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (offset + 8 <= bytes.byteLength) {
    const chunkId = new TextDecoder("ascii").decode(bytes.slice(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt " && chunkDataOffset + 16 <= bytes.byteLength) {
      byteRate = view.getUint32(chunkDataOffset + 8, true);
    }

    if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (byteRate <= 0 || dataSize <= 0) {
    return null;
  }

  return dataSize / byteRate;
}

export async function deriveAudioSeconds(audio: Blob) {
  try {
    const metadata = await parseBlob(audio, { duration: true });
    if (metadata.format.duration && Number.isFinite(metadata.format.duration)) {
      return roundAudioSeconds(metadata.format.duration);
    }
  } catch {
    // Fall through to lightweight WAV parsing below.
  }

  try {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const wavDuration = readWavDuration(bytes);
    if (wavDuration && Number.isFinite(wavDuration)) {
      return roundAudioSeconds(wavDuration);
    }
  } catch {
    // Duration remains unknown.
  }

  return null;
}
