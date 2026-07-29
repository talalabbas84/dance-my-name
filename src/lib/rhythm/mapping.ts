/** Cycles syllables across every beat slot in order, repeating as needed. */
export function mapSyllablesToBeats(syllables: string[], beatCount: number): number[] {
  if (syllables.length === 0) return Array(beatCount).fill(0);
  return Array.from({ length: beatCount }, (_, i) => i % syllables.length);
}
