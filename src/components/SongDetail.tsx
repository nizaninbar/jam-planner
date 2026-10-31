import { useEffect, useState } from 'react';
import { addSongLink, deleteSong, deleteSongLink, updateSong } from '../data/bandService';
import { useSaveStatus } from '../hooks/useSaveStatus';
import type { Band, Playlist } from '../types/band';
import { getAdjacentSongs, getPlaylistsContainingSong, isHttpUrl } from '../utils/playlists';
import { Icon } from './Icon';
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
  const [linkDescription, setLinkDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveStatus, track] = useSaveStatus();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [songId]);

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

  const playlists = getPlaylistsContainingSong(song.id, band.playlists);
  const adjacent = playlist && onSelectSong ? getAdjacentSongs(playlist, band.songs, song.id) : null;

  const save = (fields: { name?: string; lyrics?: string; chords?: string; structure?: string }) => {
    track(
      apply(
        updateSong(band.id, song.id, {
          name: fields.name ?? song.name,
          lyrics: fields.lyrics ?? song.lyrics,
          chords: fields.chords ?? song.chords,
          structure: fields.structure ?? song.structure,
        }),
      ),
    );
  };

  const handleAddLink = () => {
    const url = linkUrl.trim();
    if (!isHttpUrl(url)) {
      setLinkError('הכתובת חייבת להתחיל ב-http:// או https://');
      return;
    }
    setLinkError(null);
    const position = song.links.length;
    apply(addSongLink(band.id, song.id, position, linkDescription.trim(), url));
    setLinkDescription('');
    setLinkUrl('');
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
    field: 'lyrics' | 'chords' | 'structure',
    rows: number,
    mono = false,
  ) => (
    <label>
      {label}
      <textarea
        key={`${field}-${song[field] ?? ''}`}
        rows={rows}
        className={mono ? 'mono' : undefined}
        defaultValue={song[field] ?? ''}
        onBlur={(e) => e.target.value !== (song[field] ?? '') && save({ [field]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="page-container">
      <button type="button" className="back-btn" onClick={onBack}>
        → חזרה
      </button>

      {playlist && adjacent && onSelectSong && (
        <nav className="song-nav" aria-label="ניווט בפלייליסט">
          <button
            type="button"
            className="icon-btn"
            disabled={!adjacent.prev}
            onClick={() => adjacent.prev && onSelectSong(adjacent.prev.id)}
            aria-label="השיר הקודם"
          >
            <Icon name="chevron-right" />
          </button>
          <span className="song-nav-label">
            {adjacent.index + 1} / {adjacent.total} · {playlist.name}
          </span>
          <button
            type="button"
            className="icon-btn"
            disabled={!adjacent.next}
            onClick={() => adjacent.next && onSelectSong(adjacent.next.id)}
            aria-label="השיר הבא"
          >
            <Icon name="chevron-left" />
          </button>
        </nav>
      )}

      {editing && canEdit ? (
        <>
          <div className="form-stack">
            <label>
              שם
              <input
                key={`n-${song.name}`}
                type="text"
                defaultValue={song.name}
                onBlur={(e) => e.target.value.trim() && e.target.value !== song.name && save({ name: e.target.value.trim() })}
              />
            </label>
            {textField('מבנה', 'structure', 2)}
            {textField('אקורדים', 'chords', 5, true)}
            {textField('מילים', 'lyrics', 8)}
          </div>
          <SaveIndicator status={saveStatus} />
        </>
      ) : (
        <article className="song-reader">
          <h2 className="song-reader-title">{song.name}</h2>
          {song.structure && <p className="song-reader-structure">{song.structure}</p>}
          {song.chords && <pre className="song-reader-chords">{song.chords}</pre>}
          {song.lyrics && <p className="song-reader-lyrics">{song.lyrics}</p>}
          {!song.structure && !song.chords && !song.lyrics && <p className="muted">אין עדיין מילים או אקורדים.</p>}
        </article>
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
      <ul className="item-list">
        {song.links.map((link) => (
          <li key={link.id} className="order-row">
            <a className="list-item" href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="list-item-title">{link.description || link.url}</span>
              {link.description && <span className="list-item-meta link-url">{link.url}</span>}
            </a>
            {canEdit && (
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => apply(deleteSongLink(band.id, link.id))}
                aria-label="מחק קישור"
              >
                <Icon name="close" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="form-stack">
          <input
            type="text"
            placeholder="תיאור (למשל: הקלטת חזרה)"
            value={linkDescription}
            onChange={(e) => setLinkDescription(e.target.value)}
          />
          <input
            type="url"
            dir="ltr"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          {linkError && <p className="error-text">{linkError}</p>}
          <button type="button" className="toggle-btn toggle-available" onClick={handleAddLink}>
            + הוסף קישור
          </button>
        </div>
      )}

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
