import type { BeatSlot, DanceStyle, PercussionHit, RhythmStyleDefinition } from "@/types/rhythm";

function hit(type: PercussionHit["type"], velocity: number, subdivisionOffset = 0): PercussionHit {
  return { type, velocity, subdivisionOffset };
}

function slot(index: number, label: string, isAccent: boolean, instrument: PercussionHit[]): BeatSlot {
  return { index, label, isAccent, instrument };
}

// Eight-count salsa pattern, built as a full son ensemble rather than one
// simplified loop:
//  - Clave: authentic 3-2 pattern — five strokes (1, the "and" of 2, 4, 6, 7),
//    the "and of 2" a true off-beat subdivision, not just another full beat.
//  - Tumbao conga: the classic "open-open-slap" figure (& of 2, 4, & of 4,
//    repeated each bar) using conga-low as the open tone and conga-hi as the
//    slap, landing right before each downbeat the way a real tumbao does.
//  - Tumbao bass: anticipated bass doubling that same off-beat syncopation.
//  - Cowbell: marks the strong pulse on 1 and 5.
//  - Cascara: the continuous timbale-shell pattern that drives the groove
//    between the accents.
//  - Maracas: a soft continuous shimmer underneath everything.
//  - Güiro: a light scrape coloring counts 3 and 7.
// Treated as eighth-note slots, so a full loop covers two musical bars,
// giving salsa a busier, faster-ticking feel than bachata at the same BPM.
const SALSA_PATTERN: BeatSlot[] = [
  slot(0, "1", true, [
    hit("cowbell", 0.9),
    hit("clave", 0.9),
    hit("conga-hi", 0.8),
    hit("maracas", 0.35),
  ]),
  slot(1, "2", false, [
    hit("clave", 0.7, 0.5),
    hit("bass", 0.75, 0.5),
    hit("conga-low", 0.75, 0.5),
    hit("cascara", 0.5),
    hit("cascara", 0.4, 0.5),
    hit("maracas", 0.35),
  ]),
  slot(2, "3", false, [hit("cascara", 0.5), hit("guiro", 0.4), hit("maracas", 0.35)]),
  slot(3, "4", false, [
    hit("clave", 0.7),
    hit("bass", 0.7),
    hit("conga-low", 0.8),
    hit("conga-hi", 0.85, 0.5),
    hit("cascara", 0.5),
    hit("cascara", 0.4, 0.5),
    hit("maracas", 0.35),
  ]),
  slot(4, "5", true, [hit("cowbell", 0.9), hit("conga-hi", 0.9), hit("maracas", 0.35)]),
  slot(5, "6", false, [
    hit("clave", 0.7),
    hit("bass", 0.75, 0.5),
    hit("conga-low", 0.75, 0.5),
    hit("cascara", 0.5),
    hit("cascara", 0.4, 0.5),
    hit("maracas", 0.35),
  ]),
  slot(6, "7", false, [hit("clave", 0.7), hit("cascara", 0.5), hit("guiro", 0.4), hit("maracas", 0.35)]),
  slot(7, "8", false, [
    hit("bass", 0.7),
    hit("conga-low", 0.8),
    hit("conga-hi", 0.85, 0.5),
    hit("cascara", 0.5),
    hit("cascara", 0.4, 0.5),
    hit("maracas", 0.35),
  ]),
];

// Four-count bachata pattern, one quarter note per slot — spacious and smooth,
// with a continuous scraped güira texture (multiple quick strokes per beat via
// subdivisionOffset, rather than one hit per beat) and a distinctive brighter
// accent on the "TAP" of beat four.
const BACHATA_PATTERN: BeatSlot[] = [
  slot(0, "1", false, [hit("bongo-low", 0.7), hit("bass", 0.8), hit("guira", 0.35), hit("guira", 0.25, 0.5)]),
  slot(1, "2", false, [
    hit("bongo-hi", 0.6),
    hit("guira", 0.4),
    hit("guira", 0.25, 0.25),
    hit("guira", 0.35, 0.5),
    hit("guira", 0.25, 0.75),
  ]),
  slot(2, "3", false, [
    hit("bongo-low", 0.6),
    hit("bass", 0.4),
    hit("guira", 0.4),
    hit("guira", 0.25, 0.25),
    hit("guira", 0.35, 0.5),
    hit("guira", 0.25, 0.75),
  ]),
  slot(3, "TAP", true, [hit("accent-hit", 0.95), hit("bongo-hi", 0.9), hit("guira", 0.7), hit("guira", 0.4, 0.5)]),
];

export const RHYTHM_STYLES: Record<DanceStyle, RhythmStyleDefinition> = {
  salsa: {
    id: "salsa",
    name: "Salsa",
    tagline: "Sharp, bright, on the one.",
    beatsPerBar: 8,
    slotsPerBeat: 2,
    pattern: SALSA_PATTERN,
    defaultBpmRange: [90, 140],
    defaultBpm: 110,
    theme: {
      primary: "#FF4D5A",
      secondary: "#FFC857",
      glow: "rgba(255, 77, 90, 0.45)",
      bg: "radial-gradient(circle at 50% 20%, rgba(255,77,90,0.25), transparent 60%)",
    },
    motion: { activeScale: 1.22, rotate: 6, personality: "sharp" },
    tapInstruments: ["clave", "cowbell", "conga-low", "conga-hi", "cascara", "maracas", "guiro"],
    labelTemplate: (name) => `${name} is dancing salsa 🔥`,
  },
  bachata: {
    id: "bachata",
    name: "Bachata",
    tagline: "Smooth, warm, that fourth-beat hip pop.",
    beatsPerBar: 4,
    slotsPerBeat: 1,
    pattern: BACHATA_PATTERN,
    defaultBpmRange: [70, 130],
    defaultBpm: 100,
    theme: {
      primary: "#E96BA8",
      secondary: "#FFC857",
      glow: "rgba(233, 107, 168, 0.45)",
      bg: "radial-gradient(circle at 50% 20%, rgba(233,107,168,0.25), transparent 60%)",
    },
    motion: { activeScale: 1.14, rotate: 2, personality: "smooth" },
    tapInstruments: ["bongo-hi", "bongo-low", "accent-hit"],
    labelTemplate: (name) => `${name} chose bachata tonight 🌹`,
  },
};

export const DANCE_STYLES: DanceStyle[] = ["salsa", "bachata"];

/** Rotates the pattern so a different slot lines up with index 0, and optionally
 * boosts accent velocity — used for the "Surprise Me" variation. */
export function getVariantPattern(style: DanceStyle, offset: number, spicy: boolean): BeatSlot[] {
  const base = RHYTHM_STYLES[style].pattern;
  const n = base.length;
  const rotated = Array.from({ length: n }, (_, i) => base[(i + offset) % n]);

  return rotated.map((s, i) => ({
    ...s,
    index: i,
    // The count a dancer follows (1..8, or 1-2-3-TAP) stays fixed to its
    // position — only which instruments/accents land where is rotated.
    label: base[i].label,
    instrument: s.instrument.map((h) => ({
      ...h,
      velocity: spicy && s.isAccent ? Math.min(1, h.velocity * 1.2) : h.velocity,
    })),
  }));
}

/** Seconds per slot for a given style + BPM, where BPM always refers to quarter notes. */
export function slotDurationSeconds(style: DanceStyle, bpm: number): number {
  const def = RHYTHM_STYLES[style];
  const quarterNoteSeconds = 60 / bpm;
  return quarterNoteSeconds / def.slotsPerBeat;
}
