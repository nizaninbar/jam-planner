import { useEffect, useRef, useState } from 'react';
import { addSongLink, deleteSong, deleteSongLink, updateSong } from '../data/bandService';
import { useSaveStatus } from '../hooks/useSaveStatus';
import type { Band, Playlist } from '../types/band';
import { getAdjacentSongs, getPlaylistsContainingSong } from '../utils/playlists';
import { isRtlText, legacyToSheet } from '../utils/chordSheet';
import { ChordSheet } from './ChordSheet';
import { Icon } from './Icon';
import { LinkList } from './LinkList';
import { SaveIndicator } from './SaveIndicator';

interface SongDetailProps {
  band: Band;
  songId: string;
  apply: (next: Promise<Band>) => Promise<boolean>;
  canEdit: boolean;
  playlist?: Playlist;
  onSelectSong?: (songId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onBack: () => void;
}

export function SongDetail({ band, songId, apply, canEdit, playlist, onSelectSong, onOpenPlaylist, onBack }: SongDetailProps) {
  const song = band.songs.find((s) => s.id === songId);
  const [editing, setEditing] = useState(false);
  const [saveStatus, track] = useSaveStatus();
  // Manual direction override for the sheet (view + editor); null = auto-detect from Hebrew letters.
  // Remembered with its song id so navigating to another song falls back to auto-detect.
  const [dirChoice, setDirChoice] = useState<{ songId: string; dir: 'rtl' | 'ltr' } | null>(null);
  const dirOverride = dirChoice?.songId === songId ? dirChoice.dir : null;

  // Reset per-song UI state when moving to another song (the component itself stays mounted).
  const [shownSongId, setShownSongId] = useState(songId);
  // Transposition lives here (not in ChordSheet) so entering/leaving full screen, which remounts the sheet, keeps it.
  const [shift, setShift] = useState(0);
  if (shownSongId !== songId) {
    setShownSongId(songId);
    setShift(0);
    setEditing(false);
  }

  // Full-screen play mode: only the song, prev/next, and the sheet controls.
  const [fullscreen, setFullscreen] = useState(false);
  const fsBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fsBodyRef.current?.scrollTo(0, 0);
  }, [songId]);

  // Also ends if the song vanishes underneath (deleted elsewhere), so fullscreen and the wake lock don't linger.
  const fullscreenActive = fullscreen && !!song;
  useEffect(() => {
    if (!fullscreenActive) {
      return;
    }
    // Hide the browser chrome where supported (not on iPhone Safari; the overlay still fills the page),
    // and keep the screen awake while playing. Both are best-effort.
    let cancelled = false;
    document.documentElement
      .requestFullscreen?.()
      .then(() => {
        // Closed before the browser finished entering fullscreen: leave again.
        if (cancelled && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      })
      .catch(() => {});
    let lock: WakeLockSentinel | null = null;
    const acquireLock = () => {
      navigator.wakeLock
        ?.request('screen')
        .then((l) => {
          if (cancelled) {
            l.release().catch(() => {});
          } else {
            lock?.release().catch(() => {});
            lock = l;
          }
        })
        .catch(() => {});
    };
    acquireLock();
    // The browser drops the lock when the tab is hidden (phone locked, app switched); take it again on return.
    const onVisible = () => document.visibilityState === 'visible' && acquireLock();
    document.addEventListener('visibilitychange', onVisible);
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      lock?.release().catch(() => {});
    };
  }, [fullscreenActive]);

  if (!song) {
    return (
      <div className="page-container">
        <button type="button" className="back-btn" onClick={onBack}>
          → חזרה
        </button>
        <p className="muted">השיר לא נמצא.</p>
      </div>
    );
  }

  const sheetDir = dirOverride ?? (isRtlText(song.sheet ?? '') ? 'rtl' : 'ltr');
  const toggleSheetDir = () => setDirChoice({ songId, dir: sheetDir === 'rtl' ? 'ltr' : 'rtl' });
  const playlists = getPlaylistsContainingSong(song.id, band.playlists);
  const adjacent = playlist && onSelectSong ? getAdjacentSongs(playlist, band.songs, song.id) : null;

  const save = (fields: { name?: string; lyrics?: string; chords?: string; structure?: string; sheet?: string }) => {
    track(
      apply(
        updateSong(band.id, song.id, {
          name: fields.name ?? song.name,
          lyrics: fields.lyrics ?? song.lyrics,
          chords: fields.chords ?? song.chords,
          structure: fields.structure ?? song.structure,
          sheet: fields.sheet ?? song.sheet,
        }),
      ),
    );
  };

  const handleDelete = () => {
    const message =
      playlists.length > 0
        ? `למחוק את "${song.name}"? השיר יוסר גם מ-${playlists.length} פלייליסטים.`
        : `למחוק את "${song.name}"?`;
    if (window.confirm(message)) {
      apply(deleteSong(band.id, song.id));
      onBack();
    }
  };

  // key remounts a field when its saved value changes; saving happens on blur.
  const textField = (
    label: string,
    field: 'lyrics' | 'chords' | 'structure' | 'sheet',
    rows: number,
    mono = false,
  ) => (
    <label>
      {label}
      <textarea
        key={`${song.id}-${field}-${song[field] ?? ''}`}
        rows={rows}
        className={mono ? 'mono' : undefined}
        style={field === 'sheet' && sheetDir === 'rtl' ? { direction: 'rtl', textAlign: 'right' } : undefined}
        defaultValue={song[field] ?? ''}
        onBlur={(e) => e.target.value !== (song[field] ?? '') && save({ [field]: e.target.value })}
      />
    </label>
  );

  const prevButton = adjacent && onSelectSong && (
    <button
      type="button"
      className="icon-btn"
      disabled={!adjacent.prev}
      onClick={() => adjacent.prev && onSelectSong(adjacent.prev.id)}
      aria-label="השיר הקודם"
    >
      <Icon name="chevron-right" />
    </button>
  );
  const nextButton = adjacent && onSelectSong && (
    <button
      type="button"
      className="icon-btn"
      disabled={!adjacent.next}
      onClick={() => adjacent.next && onSelectSong(adjacent.next.id)}
      aria-label="השיר הבא"
    >
      <Icon name="chevron-left" />
    </button>
  );

  const reader = (showTitle: boolean) => (
    <article className="song-reader">
      {showTitle && <h2 className="song-reader-title">{song.name}</h2>}
      {song.structure && <p className="song-reader-structure">{song.structure}</p>}
      {song.sheet ? (
        <ChordSheet key={song.id} sheet={song.sheet} dir={sheetDir} onToggleDir={toggleSheetDir} shift={shift} onShiftChange={setShift} onFullscreen={showTitle ? () => setFullscreen(true) : undefined} />
      ) : (
        <>
          {showTitle && (
            <button type="button" className="sheet-reset" onClick={() => setFullscreen(true)}>
              <Icon name="fullscreen" size={16} /> מסך מלא
            </button>
          )}
          {song.chords && <pre className="song-reader-chords">{song.chords}</pre>}
          {song.lyrics && <p className="song-reader-lyrics">{song.lyrics}</p>}
        </>
      )}
      {!song.structure && !song.sheet && !song.chords && !song.lyrics && (
        <p className="muted">אין עדיין מילים או אקורדים.</p>
      )}
    </article>
  );

  if (fullscreen) {
    return (
      <div className="song-fullscreen" role="dialog" aria-modal="true" aria-label={song.name}>
        <div className="fs-bar">
          <button type="button" className="icon-btn" onClick={() => setFullscreen(false)} aria-label="יציאה ממסך מלא" autoFocus>
            <Icon name="close" />
          </button>
          {prevButton}
          <span className="song-nav-label">
            {song.name}
            {adjacent && ` · ${adjacent.index + 1}/${adjacent.total}`}
          </span>
          {nextButton}
        </div>
        <div className="fs-body" ref={fsBodyRef}>
          {reader(false)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button type="button" className="back-btn" onClick={onBack}>
        → חזרה
      </button>

      {playlist && adjacent && onSelectSong && (
        <nav className="song-nav" aria-label="ניווט בפלייליסט">
          {prevButton}
          <span className="song-nav-label">
            {adjacent.index + 1} / {adjacent.total} · {playlist.name}
          </span>
          {nextButton}
        </nav>
      )}

      {editing && canEdit ? (
        <>
          <div className="form-stack">
            <label>
              שם
              <input
                key={`n-${song.id}-${song.name}`}
                type="text"
                defaultValue={song.name}
                onBlur={(e) => e.target.value.trim() && e.target.value !== song.name && save({ name: e.target.value.trim() })}
              />
            </label>
            {textField('מבנה', 'structure', 2)}
            {textField('גיליון נגינה', 'sheet', 12, true)}
            <button type="button" className="btn btn-secondary" onClick={toggleSheetDir}>
              {sheetDir === 'rtl' ? 'כיוון: ימין לשמאל' : 'כיוון: שמאל לימין'} (החלף)
            </button>
            <p className="sheet-hint">
              שורה ראשונה אקורדים, שנייה מילים, שלישית אקורדים וכן הלאה. שורה ריקה = אין אקורדים / אין מילים.
            </p>
            {!song.sheet && (song.chords || song.lyrics) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => save({ sheet: legacyToSheet(song.chords, song.lyrics) })}
              >
                העתק אקורדים ומילים לגיליון
              </button>
            )}
            {textField('אקורדים (ישן)', 'chords', 5, true)}
            {textField('מילים (ישן)', 'lyrics', 8)}
          </div>
          <SaveIndicator status={saveStatus} />
        </>
      ) : (
        reader(true)
      )}
      {canEdit && (
        <button type="button" className="btn btn-secondary edit-toggle" onClick={() => setEditing((e) => !e)}>
          {editing ? (
            <>
              <Icon name="check" size={16} /> סיום עריכה
            </>
          ) : (
            <>
              <Icon name="edit" size={16} /> ערוך
            </>
          )}
        </button>
      )}

      <h3 className="section-title">קישורים</h3>
      {song.links.length === 0 && <p className="muted">אין קישורים.</p>}
      <LinkList
        key={song.id}
        links={song.links}
        canEdit={canEdit}
        onAdd={(description, url) => apply(addSongLink(band.id, song.id, song.links.length, description, url))}
        onDelete={(linkId) => apply(deleteSongLink(band.id, linkId))}
      />

      <h3 className="section-title">מופיע בפלייליסטים</h3>
      {playlists.length === 0 && <p className="muted">השיר לא נמצא באף פלייליסט.</p>}
      <ul className="item-list">
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            <button type="button" className="list-item" onClick={() => onOpenPlaylist(playlist.id)}>
              <span className="list-item-title">{playlist.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {canEdit && (
        <button type="button" className="delete-btn" onClick={handleDelete}>
          מחק שיר
        </button>
      )}
    </div>
  );
}
