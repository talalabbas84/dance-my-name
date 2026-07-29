import type { BeatSlot, DanceStyle, MelodyNote } from "@/types/rhythm";

// Major pentatonic semitone offsets — every degree is consonant with every
// other, so any name produces a tune with no "wrong" notes.
const PENTATONIC = [0, 2, 4, 7, 9];

// Salsa gets a brighter root, bachata a warmer/lower one, echoing the same
// sharp-vs-smooth personality already used for motion and percussion.
const STYLE_ROOT_HZ: Record<DanceStyle, number> = {
  salsa: 293.66, // D4
  bachata: 220.0, // A3
};

// A short "chant cell" read backwards from the last syllable, so the final
// syllable of a name always resolves on the tonic — a simple, deterministic
// stand-in for a satisfying rhyme.
const CHANT_CELL = [0, 2, 4, 0];

function degreeToFreq(root: number, degree: number): number {
  const octaveShift = Math.floor(degree / PENTATONIC.length);
  const idx = ((degree % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length;
  const semitones = octaveShift * 12 + PENTATONIC[idx];
  return root * Math.pow(2, semitones / 12);
}

function buildDegrees(syllableCount: number): number[] {
  if (syllableCount <= 0) return [];
  if (syllableCount === 1) return [2];

  return Array.from({ length: syllableCount }, (_, i) => {
    const distanceFromEnd = syllableCount - 1 - i;
    return CHANT_CELL[distanceFromEnd % CHANT_CELL.length];
  });
}

/** One pitch per syllable in the name, always resolving to the tonic on the last syllable. */
export function buildSyllableFrequencies(syllableCount: number, style: DanceStyle): number[] {
  const root = STYLE_ROOT_HZ[style];
  return buildDegrees(syllableCount).map((degree) => degreeToFreq(root, degree));
}

/** Builds one sung note per beat slot, aligned to whichever syllable lands there. */
export function buildMelodyNotes(
  syllableFreqs: number[],
  pattern: BeatSlot[],
  beatToSyllable: number[],
  slotDuration: number
): MelodyNote[] {
  return pattern.map((slot, i) => ({
    freq: syllableFreqs[beatToSyllable[i]] ?? syllableFreqs[0] ?? 220,
    duration: (slot.isAccent ? 1.5 : 0.9) * slotDuration,
    gain: slot.isAccent ? 0.62 : 0.44,
  }));
}
