import type { DanceStyle } from "@/types/rhythm";

// Salsa gets a brighter, faster hype-man energy; bachata a smoother, slightly
// slower and warmer delivery — matching the same sharp-vs-smooth personality
// used everywhere else in the app.
const CALLOUT_STYLE: Record<DanceStyle, { rate: number; pitch: number }> = {
  salsa: { rate: 1.15, pitch: 1.15 },
  bachata: { rate: 0.95, pitch: 0.92 },
};

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speaks the name once via the browser's built-in TTS voice, as a one-shot
 * hype-man callout layered over the beat — not a beat-synced singing voice,
 * just a real spoken "shout-out" of the name. */
export function speakNameCallout(name: string, style: DanceStyle) {
  if (!isSpeechSupported()) return;

  const params = CALLOUT_STYLE[style];
  window.speechSynthesis.cancel(); // don't let callouts stack on rapid replays

  const utterance = new SpeechSynthesisUtterance(`${name}!`);
  utterance.rate = params.rate;
  utterance.pitch = params.pitch;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function cancelNameCallout() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
