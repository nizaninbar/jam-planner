import { useState } from 'react';
import { parseChordSheet, transposePairs } from '../utils/chordSheet';

interface ChordSheetProps {
  sheet: string;
  dir: 'rtl' | 'ltr';
  onToggleDir: () => void;
}

/** Play-along view: every chord line sits directly above its lyric line. */
export function ChordSheet({ sheet, dir, onToggleDir }: ChordSheetProps) {
  // Transposition is a per-viewer, non-persisted setting: the saved sheet is never changed.
  const [shift, setShift] = useState(0);
  const pairs = transposePairs(parseChordSheet(sheet), shift);
  const step = (delta: number) => setShift((s) => (((s + delta + 5) % 12) + 12) % 12 - 5);

  return (
    <div>
      <div className="sheet-toolbar">
        <div className="sheet-tool-group" role="group" aria-label="טרנספוזיציה">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="חצי טון למטה">
            −
          </button>
          <span className="sheet-shift" dir="ltr" aria-live="polite">
            {shift > 0 ? `+${shift}` : shift}
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
        <button type="button" className="sheet-reset" onClick={onToggleDir}>
          {dir === 'rtl' ? 'כיוון: ימין לשמאל' : 'כיוון: שמאל לימין'}
        </button>
      </div>
      <div className="chord-sheet" dir={dir}>
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
