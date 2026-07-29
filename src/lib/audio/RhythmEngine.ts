import type { BeatSlot, DanceStyle, MelodyNote, PercussionHit } from "@/types/rhythm";
import { playPercussionHit, playVocalTone } from "./sound";

type BeatCallback = (beatIndex: number, time: number) => void;

interface QueuedBeat {
  beatIndex: number;
  time: number;
}

/**
 * Look-ahead scheduler (Chris Wilson's "tale of two clocks" pattern): a cheap
 * setTimeout loop repeatedly schedules real audio events a little ahead of
 * time using the AudioContext clock, which is what actually keeps timing
 * tight — the timeout cadence itself is not the source of precision.
 */
export class RhythmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadSec = 0.12;

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;

  private nextSlotTime = 0;
  private nextSlotIndex = 0;
  private isRunning = false;
  private beatQueue: QueuedBeat[] = [];

  private pattern: BeatSlot[] = [];
  private notes: (MelodyNote | null)[] = [];
  private slotDuration = 0.5;
  private onBeat: BeatCallback | null = null;
  private style: DanceStyle = "salsa";

  private volume = 0.8;
  private muted = false;

  init(): boolean {
    if (this.ctx) return true;
    try {
      const AudioCtor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return false;

      this.ctx = new AudioCtor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.unlockForMobile();
      return true;
    } catch {
      this.ctx = null;
      this.masterGain = null;
      return false;
    }
  }

  get isSupported(): boolean {
    return this.ctx !== null;
  }

  /** Whether audio will actually be audible right now — distinct from
   * `isSupported`, which only means the AudioContext could be constructed. */
  get isAudioRunning(): boolean {
    return this.ctx?.state === "running";
  }

  /**
   * Some mobile browsers (iOS Safari especially) keep a freshly-created
   * AudioContext silent until a real buffer has actually played through it —
   * a `resume()` call alone can report success without any sound following.
   * Playing a near-silent one-sample buffer immediately, in the same user
   * gesture that created the context, is the standard workaround.
   */
  private unlockForMobile() {
    if (!this.ctx) return;
    try {
      const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // Best-effort unlock only — playback still proceeds without it.
    }
  }

  async resume(): Promise<void> {
    if (!this.ctx) return;
    if (this.ctx.state !== "running") {
      await this.ctx.resume().catch(() => undefined);
    }
    // Some mobile browsers resolve resume() without actually reaching
    // "running" on the first attempt — nudge it once more.
    if (this.ctx.state !== "running") {
      await this.ctx.resume().catch(() => undefined);
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.volume;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : this.volume;
  }

  playOneShot(hit: PercussionHit) {
    if (!this.ctx || !this.masterGain) return;
    playPercussionHit(this.ctx, this.masterGain, this.ctx.currentTime + 0.01, hit);
  }

  singOneShot(note: MelodyNote, style: DanceStyle) {
    if (!this.ctx || !this.masterGain) return;
    playVocalTone(this.ctx, this.masterGain, this.ctx.currentTime + 0.01, note, style);
  }

  start(
    pattern: BeatSlot[],
    slotDuration: number,
    onBeat: BeatCallback,
    notes: (MelodyNote | null)[] = [],
    style: DanceStyle = "salsa"
  ) {
    if (!this.ctx || !this.masterGain || pattern.length === 0) return;
    this.stop();

    this.pattern = pattern;
    this.notes = notes;
    this.slotDuration = slotDuration;
    this.onBeat = onBeat;
    this.style = style;
    this.nextSlotIndex = 0;
    this.nextSlotTime = this.ctx.currentTime + 0.05;
    this.isRunning = true;

    this.scheduler();
    this.rafLoop();
  }

  private scheduler = () => {
    if (!this.ctx || !this.isRunning) return;

    while (this.nextSlotTime < this.ctx.currentTime + this.scheduleAheadSec) {
      const slot = this.pattern[this.nextSlotIndex];
      if (slot && this.masterGain) {
        for (const h of slot.instrument) {
          const hitTime = this.nextSlotTime + (h.subdivisionOffset ?? 0) * this.slotDuration;
          playPercussionHit(this.ctx, this.masterGain, hitTime, h);
        }
        const note = this.notes[this.nextSlotIndex];
        if (note) playVocalTone(this.ctx, this.masterGain, this.nextSlotTime, note, this.style);
      }
      this.beatQueue.push({ beatIndex: this.nextSlotIndex, time: this.nextSlotTime });
      this.nextSlotTime += this.slotDuration;
      this.nextSlotIndex = (this.nextSlotIndex + 1) % this.pattern.length;
    }

    this.timerId = setTimeout(this.scheduler, this.lookaheadMs);
  };

  private rafLoop = () => {
    if (!this.isRunning || !this.ctx) return;
    const now = this.ctx.currentTime;

    while (this.beatQueue.length > 0 && this.beatQueue[0].time <= now) {
      const beat = this.beatQueue.shift();
      if (beat) this.onBeat?.(beat.beatIndex, beat.time);
    }

    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.beatQueue = [];
  }

  dispose() {
    this.stop();
    this.masterGain?.disconnect();
    this.masterGain = null;
    if (this.ctx) {
      this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
