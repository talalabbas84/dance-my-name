import type { DanceStyle, MelodyNote, PercussionHit } from "@/types/rhythm";

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseBuffers.get(ctx);
  if (cached) return cached;

  const bufferSize = ctx.sampleRate * 1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

interface ToneOptions {
  freq: number;
  endFreq?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}

function playTone(ctx: AudioContext, destination: AudioNode, time: number, opts: ToneOptions) {
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, time);
  if (opts.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.endFreq, 1), time + opts.duration);
  }

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(Math.max(opts.gain, 0.0001), time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + opts.duration);

  osc.connect(gainNode).connect(destination);
  osc.start(time);
  osc.stop(time + opts.duration + 0.02);
}

interface NoiseOptions {
  duration: number;
  filterFreq: number;
  filterQ?: number;
  gain: number;
  filterType?: BiquadFilterType;
}

function playNoiseHit(ctx: AudioContext, destination: AudioNode, time: number, opts: NoiseOptions) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.frequency.value = opts.filterFreq;
  filter.Q.value = opts.filterQ ?? 1;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(Math.max(opts.gain, 0.0001), time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + opts.duration);

  source.connect(filter).connect(gainNode).connect(destination);
  source.start(time);
  source.stop(time + opts.duration + 0.02);
}

function playCowbell(ctx: AudioContext, destination: AudioNode, time: number, gain: number) {
  const duration = 0.3;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(Math.max(gain, 0.0001), time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 1.4;
  filter.connect(gainNode).connect(destination);

  for (const freq of [587.33, 845]) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration);
  }
}

interface VocalStyleParams {
  /** Two formant bands shaping the vowel; salsa runs brighter/tighter, bachata warmer/rounder. */
  formant1Freq: number;
  formant1Q: number;
  formant2Freq: number;
  formant2Q: number;
  /** Faster + shallower reads as a punchy call; slower + deeper reads as a sustained croon. */
  vibratoRate: number;
  vibratoDepth: number;
  /** Snappier attack for a shouted salsa "call"; softer attack for a bachata glide-in. */
  attackTime: number;
  /** Fraction of the note's slot actually held before decaying — short & separated
   *  (staccato) for salsa's punchy montuno call, near-full (legato) for bachata's croon. */
  sustainRatio: number;
  /** How far below the target pitch the note scoops in from at onset. */
  scoopAmount: number;
}

const VOCAL_STYLE: Record<DanceStyle, VocalStyleParams> = {
  salsa: {
    formant1Freq: 900,
    formant1Q: 8,
    formant2Freq: 1500,
    formant2Q: 9,
    vibratoRate: 6.4,
    vibratoDepth: 0.007,
    attackTime: 0.015,
    sustainRatio: 0.55,
    scoopAmount: 0.055,
  },
  bachata: {
    formant1Freq: 700,
    formant1Q: 5,
    formant2Freq: 1150,
    formant2Q: 6,
    vibratoRate: 5.0,
    vibratoDepth: 0.017,
    attackTime: 0.05,
    sustainRatio: 0.92,
    scoopAmount: 0.025,
  },
};

/**
 * Synthesizes a short sung vowel tone: a harmonic-rich sawtooth shaped by two
 * parallel bandpass "formant" filters (the standard cheap-vocal-synth trick —
 * formants are what make a buzzy source sound like an "ahh" vowel rather than
 * a synth pad), plus a sub-octave sine for body, a pitch scoop into the note,
 * and vibrato on the sustain. Salsa and bachata each get their own formant
 * shape, vibrato character, attack, and note length (staccato "call" vs
 * legato croon) so the same melody reads as two distinct vocal deliveries.
 */
export function playVocalTone(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  note: MelodyNote,
  style: DanceStyle
) {
  const params = VOCAL_STYLE[style];
  const duration = Math.max(note.duration, 0.05) * params.sustainRatio;
  const gain = Math.max(note.gain, 0.0001);
  const freq = note.freq;

  const source = ctx.createOscillator();
  source.type = "sawtooth";
  source.frequency.setValueAtTime(freq * (1 - params.scoopAmount), time);
  source.frequency.exponentialRampToValueAtTime(freq, time + params.attackTime);

  // Sub-octave sine for low-end body only — kept quiet and lowpassed so it
  // reinforces warmth without competing with the sawtooth's own harmonics
  // for "which octave is the pitch" (a too-loud sub pulls the ear down an
  // octave from the note that's actually meant to be sung).
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(freq / 2, time);
  const subFilter = ctx.createBiquadFilter();
  subFilter.type = "lowpass";
  subFilter.frequency.value = Math.min(freq, 400);

  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = params.vibratoRate;
  const vibratoDepth = ctx.createGain();
  vibratoDepth.gain.value = freq * params.vibratoDepth;
  vibrato.connect(vibratoDepth).connect(source.frequency);

  // Two formants shaping the vowel — tighter/brighter for salsa's punch,
  // wider/lower for bachata's warmth.
  const formant1 = ctx.createBiquadFilter();
  formant1.type = "bandpass";
  formant1.frequency.value = params.formant1Freq;
  formant1.Q.value = params.formant1Q;
  const formant1Gain = ctx.createGain();
  formant1Gain.gain.value = 1.1;

  const formant2 = ctx.createBiquadFilter();
  formant2.type = "bandpass";
  formant2.frequency.value = params.formant2Freq;
  formant2.Q.value = params.formant2Q;
  const formant2Gain = ctx.createGain();
  formant2Gain.gain.value = 0.6;

  const subMix = ctx.createGain();
  subMix.gain.value = 0.14;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(gain, time + params.attackTime * 0.7);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.connect(formant1).connect(formant1Gain).connect(envelope);
  source.connect(formant2).connect(formant2Gain).connect(envelope);
  sub.connect(subFilter).connect(subMix).connect(envelope);
  envelope.connect(destination);

  const stopAt = time + duration + 0.05;
  source.start(time);
  sub.start(time);
  vibrato.start(time);
  source.stop(stopAt);
  sub.stop(stopAt);
  vibrato.stop(stopAt);
}

/** Synthesizes and schedules a single percussion hit at a precise AudioContext time. */
export function playPercussionHit(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  hit: PercussionHit
) {
  const v = Math.max(0, Math.min(1, hit.velocity));

  switch (hit.type) {
    case "clave":
      playTone(ctx, destination, time, { freq: 2500, endFreq: 1800, duration: 0.05, gain: 0.5 * v, type: "triangle" });
      break;
    case "conga-low":
      playTone(ctx, destination, time, { freq: 190, endFreq: 110, duration: 0.18, gain: 0.6 * v, type: "sine" });
      break;
    case "conga-hi":
      playTone(ctx, destination, time, { freq: 320, endFreq: 200, duration: 0.14, gain: 0.5 * v, type: "sine" });
      break;
    case "bongo-low":
      playTone(ctx, destination, time, { freq: 260, endFreq: 170, duration: 0.13, gain: 0.55 * v, type: "sine" });
      break;
    case "bongo-hi":
      playTone(ctx, destination, time, { freq: 430, endFreq: 290, duration: 0.11, gain: 0.5 * v, type: "sine" });
      break;
    case "cowbell":
      playCowbell(ctx, destination, time, 0.35 * v);
      break;
    case "cascara":
      // Timbale-shell click: tight, dry, and higher-pitched than the clave's
      // clean tone, so the two stay distinguishable when layered.
      playNoiseHit(ctx, destination, time, { duration: 0.035, filterFreq: 3200, filterQ: 3.5, gain: 0.28 * v });
      break;
    case "maracas":
      playNoiseHit(ctx, destination, time, { duration: 0.07, filterFreq: 7500, filterQ: 0.7, gain: 0.2 * v });
      break;
    case "guiro":
      // Hollow gourd scrape — lower and more resonant than the metallic güira.
      playNoiseHit(ctx, destination, time, { duration: 0.09, filterFreq: 1600, filterQ: 2.2, gain: 0.26 * v });
      break;
    case "guira":
      playNoiseHit(ctx, destination, time, { duration: 0.1, filterFreq: 6500, filterQ: 0.6, gain: 0.28 * v });
      break;
    case "bass":
      playTone(ctx, destination, time, { freq: 90, endFreq: 55, duration: 0.3, gain: 0.7 * v, type: "triangle" });
      break;
    case "accent-hit":
      playNoiseHit(ctx, destination, time, { duration: 0.15, filterFreq: 4000, filterQ: 0.5, gain: 0.35 * v });
      playTone(ctx, destination, time, { freq: 900, endFreq: 500, duration: 0.12, gain: 0.45 * v, type: "square" });
      break;
  }
}
