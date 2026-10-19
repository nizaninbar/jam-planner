import { useState } from 'react';
import { createPlaylist } from '../data/bandService';
import type { Band } from '../types/band';

interface PlaylistsViewProps {
  band: Band;
  apply: (next: Promise<Band>) => void;
  onOpenPlaylist: (playlistId: string) => void;
}

export function PlaylistsView({ band, apply, onOpenPlaylist }: PlaylistsViewProps) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    apply(createPlaylist(band.id, name.trim()));
    setName('');
  };

  return (
    <div className="page-container">
      <h2 className="page-title">פלייליסטים</h2>

      <div className="inline-form">
        <input
          type="text"
          placeholder="שם פלייליסט חדש"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button type="button" className="toggle-btn toggle-available" onClick={handleCreate}>
          + צור
        </button>
      </div>

      {band.playlists.length === 0 && <p className="muted">אין פלייליסטים עדיין.</p>}

      <ul className="item-list">
        {band.playlists.map((playlist) => {
          const event = band.events.find((e) => e.id === playlist.eventId);
          return (
            <li key={playlist.id}>
              <button type="button" className="list-item" onClick={() => onOpenPlaylist(playlist.id)}>
                <span className="list-item-title">{playlist.name}</span>
                <span className="list-item-meta">
                  {playlist.entries.length} שירים{event ? ` · ${event.label} (${event.date})` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
