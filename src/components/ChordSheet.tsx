import { useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import { parseChordSheet, transposePairs } from '../utils/chordSheet';

interface ChordSheetProps {
  sheet: string;
  dir: 'rtl' | 'ltr';
  onToggleDir: () => void;
  shift: number;
  onShiftChange: (shift: number) => void;
  /** Shown as a button in the toolbar; omitted while already full screen. */
  onFullscreen?: () => void;
}

const SIZE_KEY = 'sheetFontScale';
const SIZE_MIN = 0.7;
const SIZE_MAX = 2.4;
const BASE_REM = 1.05;

// Fallback for when localStorage is blocked, so the size survives remounts (song change, full screen).
let memoryScale = 1;

function loadScale(): number {
  try {
    const n = Number(localStorage.getItem(SIZE_KEY));
    return n >= SIZE_MIN && n <= SIZE_MAX ? n : memoryScale;
  } catch {
    return memoryScale;
  }
}

/** Play-along view: every chord line sits directly above its lyric line. */
export function ChordSheet({ sheet, dir, onToggleDir, shift, onShiftChange: setShift, onFullscreen }: ChordSheetProps) {
  // Transposition is a per-viewer, non-persisted setting (held by SongDetail): the saved sheet is never changed.
  // Font size is remembered per device (tablet vs phone), unlike transposition.
  const [scale, setScale] = useState(loadScale);
  const resize = (next: number) => {
    const clamped = Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(next * 10) / 10));
    setScale(clamped);
    memoryScale = clamped;
    try {
      localStorage.setItem(SIZE_KEY, String(clamped));
    } catch {
      // Storage may be unavailable; the size just won't persist.
    }
  };
  const pairs = transposePairs(parseChordSheet(sheet), shift);
  const step = (delta: number) => setShift((((shift + delta + 5) % 12) + 12) % 12 - 5);

  return (
    <div>
      <div className="sheet-toolbar">
        <div className="sheet-tool-group" role="group" aria-label="טרנספוזיציה">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="חצי טון למטה">
            −
          </button>
          <span className="sheet-shift" dir="ltr" aria-live="polite">
            {shift > 0 ? `+${shift / 2}` : shift / 2}
          </span>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="חצי טון למעלה">
            +
          </button>
          {shift !== 0 && (
            <button type="button" className="sheet-reset" onClick={() => setShift(0)}>
              איפוס
            </button>
          )}
        </div>
        <div className="sheet-tool-group" role="group" aria-label="גודל גופן">
          <button type="button" className="icon-btn" onClick={() => resize(scale - 0.1)} aria-label="הקטן גופן" disabled={scale <= SIZE_MIN}>
            A−
          </button>
          <span className="sheet-size" dir="ltr" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <button type="button" className="icon-btn" onClick={() => resize(scale + 0.1)} aria-label="הגדל גופן" disabled={scale >= SIZE_MAX}>
            A+
          </button>
        </div>
        {onFullscreen && (
          <button type="button" className="sheet-reset" onClick={onFullscreen}>
            <Icon name="fullscreen" size={16} /> מסך מלא
          </button>
        )}
        <button type="button" className="sheet-reset" onClick={onToggleDir}>
          {dir === 'rtl' ? 'כיוון: ימין לשמאל' : 'כיוון: שמאל לימין'}
        </button>
      </div>
      <div className="chord-sheet" dir={dir} style={{ '--sheet-font-size': `${(BASE_REM * scale).toFixed(3)}rem` } as CSSProperties}>
        {pairs.map((pair, i) => (
          <div key={i} className="chord-pair">
            <pre className="chord-line">{pair.chords || ' '}</pre>
            <pre className="lyric-line">{pair.lyrics || ' '}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
