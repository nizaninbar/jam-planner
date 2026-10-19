import { useState } from 'react';
import { createSong } from '../data/bandService';
import type { Band } from '../types/band';
import { getPlaylistsContainingSong } from '../utils/playlists';

interface SongsViewProps {
  band: Band;
  apply: (next: Promise<Band>) => void;
  onOpenSong: (songId: string) => void;
}

export function SongsView({ band, apply, onOpenSong }: SongsViewProps) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    apply(createSong(band.id, { name: name.trim() }));
    setName('');
  };

  return (
    <div className="page-container">
      <h2 className="page-title">שירים</h2>

      <div className="inline-form">
        <input
          type="text"
          placeholder="שם שיר חדש"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button type="button" className="toggle-btn toggle-available" onClick={handleCreate}>
          + צור
        </button>
      </div>

      {band.songs.length === 0 && <p className="muted">אין שירים עדיין.</p>}

      <ul className="item-list">
        {[...band.songs]
          .sort((a, b) => a.name.localeCompare(b.name, 'he'))
          .map((song) => {
            const count = getPlaylistsContainingSong(song.id, band.playlists).length;
            return (
              <li key={song.id}>
                <button type="button" className="list-item" onClick={() => onOpenSong(song.id)}>
                  <span className="list-item-title">{song.name}</span>
                  <span className="list-item-meta">{count === 0 ? 'לא בפלייליסט' : `ב-${count} פלייליסטים`}</span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
