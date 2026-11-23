export interface SheetPair {
  chords: string;
  lyrics: string;
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Default spelling when the source has no accidentals to follow (common guitar keys).
const NEUTRAL_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NATURAL_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// root, quality/extensions, optional /bass. The suffix whitelist keeps words like "Bridge" out.
const CHORD_RE = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M|[0-9]|[#b+°ø()-])*)(?:\/([A-G][#b]?))?$/;

type Spelling = 'sharp' | 'flat' | 'neutral';

function noteSemitone(note: string): number {
  const base = NATURAL_SEMITONE[note[0]];
  return (base + (note[1] === '#' ? 1 : note[1] === 'b' ? -1 : 0) + 12) % 12;
}

function shiftNote(note: string, semitones: number, spelling: Spelling): string {
  const names = spelling === 'sharp' ? SHARP_NAMES : spelling === 'flat' ? FLAT_NAMES : NEUTRAL_NAMES;
  return names[(((noteSemitone(note) + semitones) % 12) + 12) % 12];
}

/** Transposes one token; returns it unchanged if it is not a chord (e.g. "|", "x2"). */
export function transposeChord(token: string, semitones: number, spelling: Spelling = 'neutral'): string {
  const m = CHORD_RE.exec(token);
  if (!m) return token;
  const [, root, suffix, bass] = m;
  return shiftNote(root, semitones, spelling) + suffix + (bass ? '/' + shiftNote(bass, semitones, spelling) : '');
}

/** Follow the sheet's own accidentals: flats only -> flats, sharps only -> sharps, else neutral. */
function detectSpelling(chordLines: string[]): Spelling {
  let sharps = false;
  let flats = false;
  for (const line of chordLines) {
    for (const token of line.split(/\s+/)) {
      const m = CHORD_RE.exec(token);
      if (!m) continue;
      for (const note of [m[1], m[3]]) {
        if (note?.[1] === '#') sharps = true;
        if (note?.[1] === 'b') flats = true;
      }
    }
  }
  return flats && !sharps ? 'flat' : sharps && !flats ? 'sharp' : 'neutral';
}

/** Transposes a chord line, keeping each chord at its original column so it stays above its word. */
function transposeChordLine(line: string, semitones: number, spelling: Spelling): string {
  let out = '';
  for (const match of line.matchAll(/\S+/g)) {
    const token = transposeChord(match[0], semitones, spelling);
    if (out.length < match.index) out = out.padEnd(match.index, ' ');
    else if (out.length > 0 && !out.endsWith(' ')) out += ' '; // widened chord: keep a gap
    out += token;
  }
  return out;
}

/** Transposes only the chord side of each pair; lyrics are untouched. */
export function transposePairs(pairs: SheetPair[], semitones: number): SheetPair[] {
  if (semitones % 12 === 0) return pairs;
  const spelling = detectSpelling(pairs.map((p) => p.chords));
  return pairs.map((p) => ({ ...p, chords: transposeChordLine(p.chords, semitones, spelling) }));
}

/** True when the text contains Hebrew letters; the whole sheet (chords too) is then laid out right-to-left. */
export function isRtlText(text: string): boolean {
  return /[֐-׿]/.test(text);
}

/** Interleaves a legacy chords block and lyrics block line by line, as a starting point to hand-align. */
export function legacyToSheet(chords = '', lyrics = ''): string {
  const c = chords ? chords.split(/\r?\n/) : [];
  const l = lyrics ? lyrics.split(/\r?\n/) : [];
  const out: string[] = [];
  for (let i = 0; i < Math.max(c.length, l.length); i++) out.push(c[i] ?? '', l[i] ?? '');
  return out.join('\n');
}

/**
 * A sheet is plain text whose lines strictly alternate: chords, lyrics, chords, lyrics, ...
 * Position alone decides the type (no guessing); an empty line stands for "nothing here".
 */
export function parseChordSheet(text: string): SheetPair[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  // A trailing newline would otherwise add a phantom empty pair.
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const pairs: SheetPair[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    pairs.push({ chords: lines[i], lyrics: lines[i + 1] ?? '' });
  }
  return pairs;
}
