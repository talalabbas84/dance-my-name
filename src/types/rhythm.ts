export type DanceStyle = "salsa" | "bachata";

export type PercussionType =
  | "clave"
  | "conga-low"
  | "conga-hi"
  | "cowbell"
  | "cascara"
  | "maracas"
  | "guiro"
  | "bongo-low"
  | "bongo-hi"
  | "bass"
  | "guira"
  | "accent-hit";

export interface PercussionHit {
  type: PercussionType;
  /** 0-1, scales the hit's loudness */
  velocity: number;
  /** Fraction of the slot duration to delay this hit by (e.g. 0.5 = "the and"). */
  subdivisionOffset?: number;
}

export interface BeatSlot {
  index: number;
  label: string;
  isAccent: boolean;
  instrument: PercussionHit[];
}

export interface RhythmTheme {
  primary: string;
  secondary: string;
  glow: string;
  bg: string;
}

export interface RhythmMotionPersonality {
  activeScale: number;
  rotate: number;
  personality: "sharp" | "smooth";
}

export interface RhythmStyleDefinition {
  id: DanceStyle;
  name: string;
  tagline: string;
  beatsPerBar: number;
  /** seconds per slot at 120 BPM, used to derive the musical feel (eighth vs quarter notes) */
  slotsPerBeat: number;
  pattern: BeatSlot[];
  defaultBpmRange: [number, number];
  defaultBpm: number;
  theme: RhythmTheme;
  motion: RhythmMotionPersonality;
  tapInstruments: PercussionType[];
  labelTemplate: (name: string) => string;
}

export interface RhythmVariation {
  style: DanceStyle;
  bpm: number;
  /** rotates which slot's instrumentation lines up with slot 0, for "Surprise Me" freshness */
  patternOffset: number;
  /** slightly boosts accent velocity for a "spicier" feel */
  spicy: boolean;
}

export interface NameData {
  raw: string;
  display: string;
  syllables: string[];
  isManual: boolean;
}

/** A single pitched, sung-style tone for one syllable at one beat. */
export interface MelodyNote {
  freq: number;
  duration: number;
  gain: number;
}
