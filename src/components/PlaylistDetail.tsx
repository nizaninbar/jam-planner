import { useState } from 'react';
import {
  addSongToPlaylist,
  createSong,
  deletePlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
  updatePlaylist,
} from '../data/bandService';
import type { Band } from '../types/band';
import { newId } from '../utils/id';
import { getPlaylistSongs, sortedEntries } from '../utils/playlists';

interface PlaylistDetailProps {
  band: Band;
  playlistId: string;
  apply: (next: Promise<Band>) => void;
  onOpenSong: (songId: string) => void;
  onBack: () => void;
}

export function PlaylistDetail({ band, playlistId, apply, onOpenSong, onBack }: PlaylistDetailProps) {
  const playlist = band.playlists.find((p) => p.id === playlistId);
  const [addSongId, setAddSongId] = useState('');
  const [newSongName, setNewSongName] = useState('');

  if (!playlist) {
    return (
      <div className="page-container">
        <button type="button" className="back-btn" onClick={onBack}>
          → חזרה
        </button>
        <p className="muted">הפלייליסט לא נמצא.</p>
      </div>
    );
  }

  const songs = getPlaylistSongs(playlist, band.songs);
  const inList = new Set(playlist.entries.map((e) => e.songId));
  const available = band.songs.filter((s) => !inList.has(s.id));
  const nextPosition = playlist.entries.reduce((max, e) => Math.max(max, e.position), -1) + 1;
  const takenEventIds = new Set(
    band.playlists.filter((p) => p.id !== playlist.id && p.eventId).map((p) => p.eventId),
  );
  const linkableEvents = band.events.filter((e) => !takenEventIds.has(e.id));

  const save = (fields: { name?: string; description?: string; eventId?: string | null }) => {
    apply(
      updatePlaylist(band.id, playlist.id, {
        name: fields.name ?? playlist.name,
        description: fields.description ?? playlist.description,
        eventId: fields.eventId === undefined ? playlist.eventId : fields.eventId || undefined,
      }),
    );
  };

  const move = (index: number, delta: number) => {
    const ids = sortedEntries(playlist).map((e) => e.songId);
    const target = index + delta;
    if (target < 0 || target >= ids.length) {
      return;
    }
    [ids[index], ids[target]] = [ids[target], ids[index]];
    apply(reorderPlaylist(band.id, playlist.id, ids));
  };

  const handleAddExisting = () => {
    if (!addSongId) {
      return;
    }
    apply(addSongToPlaylist(band.id, playlist.id, addSongId, nextPosition));
    setAddSongId('');
  };

  const handleCreateSong = () => {
    const name = newSongName.trim();
    if (!name) {
      return;
    }
    const songId = newId();
    apply(
      createSong(band.id, { name }, songId).then(() =>
        addSongToPlaylist(band.id, playlist.id, songId, nextPosition),
      ),
    );
    setNewSongName('');
  };

  const handleDelete = () => {
    if (window.confirm(`למחוק את הפלייליסט "${playlist.name}"? השירים עצמם לא יימחקו.`)) {
      apply(deletePlaylist(band.id, playlist.id));
      onBack();
    }
  };

  return (
    <div className="page-container">
      <button type="button" className="back-btn" onClick={onBack}>
        → חזרה
      </button>

      {/* key remounts the fields when the underlying value changes after a save */}
      <div className="form-stack">
        <label>
          שם
          <input
            key={`n-${playlist.name}`}
            type="text"
            defaultValue={playlist.name}
            onBlur={(e) => e.target.value.trim() && e.target.value !== playlist.name && save({ name: e.target.value.trim() })}
          />
        </label>
        <label>
          תיאור
          <textarea
            key={`d-${playlist.description}`}
            rows={2}
            defaultValue={playlist.description}
            onBlur={(e) => e.target.value !== playlist.description && save({ description: e.target.value })}
          />
        </label>
        <label>
          אירוע
          <select value={playlist.eventId ?? ''} onChange={(e) => save({ eventId: e.target.value })}>
            <option value="">ללא אירוע</option>
            {linkableEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.date} · {event.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="section-title">שירים ({songs.length})</h3>
      {songs.length === 0 && <p className="muted">הפלייליסט ריק.</p>}
      <ol className="item-list song-order">
        {songs.map((song, index) => (
          <li key={song.id} className="order-row">
            <button type="button" className="list-item" onClick={() => onOpenSong(song.id)}>
              <span className="list-item-title">
                {index + 1}. {song.name}
              </span>
            </button>
            <button type="button" className="icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="הזז למעלה">
              ▲
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => move(index, 1)}
              disabled={index === songs.length - 1}
              aria-label="הזז למטה"
            >
              ▼
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => apply(removeSongFromPlaylist(band.id, playlist.id, song.id))}
              aria-label="הסר מהפלייליסט"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      {available.length > 0 && (
        <div className="inline-form">
          <select value={addSongId} onChange={(e) => setAddSongId(e.target.value)}>
            <option value="">הוסף שיר קיים…</option>
            {available.map((song) => (
              <option key={song.id} value={song.id}>
                {song.name}
              </option>
            ))}
          </select>
          <button type="button" className="toggle-btn toggle-available" onClick={handleAddExisting}>
            הוסף
          </button>
        </div>
      )}

      <div className="inline-form">
        <input
          type="text"
          placeholder="שם שיר חדש"
          value={newSongName}
          onChange={(e) => setNewSongName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateSong()}
        />
        <button type="button" className="toggle-btn toggle-available" onClick={handleCreateSong}>
          + צור והוסף
        </button>
      </div>

      <button type="button" className="delete-btn" onClick={handleDelete}>
        מחק פלייליסט
      </button>
    </div>
  );
}
