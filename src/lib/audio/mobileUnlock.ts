let silentTrack: HTMLAudioElement | null = null;

/** Builds a tiny valid silent WAV file as a blob URL (44-byte header + zeroed
 * PCM samples — no external asset needed). */
function buildSilentWavUrl(durationSeconds: number, sampleRate = 8000): string {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, text: string) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  // Remaining bytes are already zero-initialized — silence.

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

/**
 * iOS silences Web Audio API output when the physical mute switch is on, but
 * does NOT silence a playing `<audio>`/`<video>` element (or spoken TTS) —
 * they use a different audio session category. Playing a real (silent)
 * `<audio>` element once, inside a user gesture, switches the page's audio
 * session to the category that ignores the mute switch — and once that's
 * set, subsequent Web Audio API output follows it too. Must be called
 * synchronously inside a click/tap handler to count as a user gesture.
 */
export function unlockMobileAudioSession() {
  if (typeof window === "undefined" || typeof Audio === "undefined") return;

  if (!silentTrack) {
    silentTrack = new Audio(buildSilentWavUrl(0.3));
    silentTrack.loop = true;
    silentTrack.setAttribute("playsinline", "true");
  }

  silentTrack.play().catch(() => undefined);
}
