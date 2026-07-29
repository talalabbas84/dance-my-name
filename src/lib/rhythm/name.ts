import type { NameData } from "@/types/rhythm";

export const MAX_NAME_LENGTH = 24;

const VALID_NAME_PATTERN = /^[\p{L}\s'-]+$/u;
const VOWEL_PATTERN = /[aeiouyáéíóúüâêîôûàèìòùäëïöõãñ]/i;

export interface NameValidationResult {
  valid: boolean;
  message: string | null;
  cleaned: string;
}

/** Trims and validates raw user input against the allowed character set and length. */
export function validateName(input: string): NameValidationResult {
  const cleaned = input.trim().replace(/\s+/g, " ");

  if (cleaned.length === 0) {
    return { valid: false, message: "Type a name to get it dancing.", cleaned };
  }
  if (cleaned.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      message: `Keep it under ${MAX_NAME_LENGTH} characters — even reggaeton needs a breath.`,
      cleaned,
    };
  }
  if (!VALID_NAME_PATTERN.test(cleaned)) {
    return {
      valid: false,
      message: "Use letters, spaces, hyphens, or apostrophes only.",
      cleaned,
    };
  }
  return { valid: true, message: null, cleaned };
}

function isVowel(ch: string): boolean {
  return VOWEL_PATTERN.test(ch);
}

/**
 * Deterministic vowel-group heuristic: consonant runs of length 1 attach to the
 * following syllable, runs of 2+ split down the middle. Not linguistically
 * perfect on purpose — users can override via "Edit syllables".
 */
function splitWord(word: string): string[] {
  if (word.length === 0) return [];

  const vowelGroups: Array<[number, number]> = [];
  let i = 0;
  while (i < word.length) {
    if (isVowel(word[i])) {
      const start = i;
      while (i < word.length && isVowel(word[i])) i++;
      vowelGroups.push([start, i]);
    } else {
      i++;
    }
  }

  if (vowelGroups.length <= 1) return [word];

  const boundaries: number[] = [];
  for (let g = 0; g < vowelGroups.length - 1; g++) {
    const [, end] = vowelGroups[g];
    const [nextStart] = vowelGroups[g + 1];
    const gap = nextStart - end;
    // A single consonant becomes the onset of the next syllable ("ba-na-na");
    // two or more split down the middle ("com-pu-ter").
    boundaries.push(gap === 1 ? end : end + 1);
  }

  const syllables: string[] = [];
  let cursor = 0;
  for (const boundary of boundaries) {
    syllables.push(word.slice(cursor, boundary));
    cursor = boundary;
  }
  syllables.push(word.slice(cursor));

  // Silent-e patch: a trailing lone "e" (Jane, Kate, Charle) reads oddly split off.
  if (syllables.length > 1 && /^e$/i.test(syllables[syllables.length - 1])) {
    const last = syllables.pop() as string;
    syllables[syllables.length - 1] += last;
  }

  return syllables.filter((s) => s.length > 0);
}

/** Splits a full display name into pronounceable chunks, word by word. */
export function autoSplitSyllables(displayName: string): string[] {
  const words = displayName.split(/[\s-]+/).filter(Boolean);
  const syllables = words.flatMap(splitWord);
  return syllables.length > 0 ? syllables : [displayName];
}

/** Parses a manual "Ta-lal" style override into a syllable list. */
export function parseManualSyllables(input: string): string[] {
  return input
    .split("-")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function buildNameData(rawInput: string, manualOverride?: string): NameData | null {
  const { valid, cleaned } = validateName(rawInput);
  if (!valid) return null;

  const manualSyllables = manualOverride ? parseManualSyllables(manualOverride) : [];
  const syllables = manualSyllables.length > 0 ? manualSyllables : autoSplitSyllables(cleaned);

  return {
    raw: rawInput,
    display: cleaned,
    syllables,
    isManual: manualSyllables.length > 0,
  };
}

export function syllablesToEditableString(syllables: string[]): string {
  return syllables.join("-");
}
