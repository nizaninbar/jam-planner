import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { DayEditorModal } from './components/DayEditorModal';
import { NavTabs, type Section } from './components/NavTabs';
import { PlaylistDetail } from './components/PlaylistDetail';
import { PlaylistsView } from './components/PlaylistsView';
import { SongDetail } from './components/SongDetail';
import { SongsView } from './components/SongsView';
import {
  createEvent,
  createPlaylist,
  deleteEvent,
  getBand,
  setMemberAvailability,
  updatePlaylist,
} from './data/bandService';
import type { AvailabilityStatus, Band, EventType } from './types/band';
import { toIsoDate } from './utils/calendar';

type View = { section: Section; playlistId?: string; songId?: string };

function App() {
  const [band, setBand] = useState<Band | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>({ section: 'calendar' });

  useEffect(() => {
    getBand('main-band')
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <div className="loading">שגיאה בטעינת הנתונים: {error}</div>;
  }

  if (!band) {
    return <div className="loading">טוען...</div>;
  }

  const handleToggle = (memberId: string, nextStatus: AvailabilityStatus) => {
    if (!selectedDate) {
      return;
    }
    setMemberAvailability(band.id, memberId, toIsoDate(selectedDate), nextStatus)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleCreateEvent = (type: EventType, label: string, location?: string) => {
    if (!selectedDate) {
      return;
    }
    createEvent(band.id, toIsoDate(selectedDate), type, label, location)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(band.id, eventId)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const apply = (next: Promise<Band>) => {
    next.then(setBand).catch((err: Error) => setError(err.message));
  };

  const openPlaylist = (playlistId: string) => {
    setSelectedDate(null);
    setView({ section: 'playlists', playlistId });
  };

  const handleCreateEventPlaylist = (eventId: string, name: string) => {
    apply(createPlaylist(band.id, name, '', eventId));
  };

  const handleLinkPlaylist = (playlistId: string, eventId: string) => {
    const playlist = band.playlists.find((p) => p.id === playlistId);
    if (playlist) {
      apply(updatePlaylist(band.id, playlistId, { name: playlist.name, description: playlist.description, eventId }));
    }
  };

  return (
    <div className="app-shell">
      <NavTabs active={view.section} onSelect={(section) => setView({ section })} />
      {view.section === 'calendar' && <Calendar band={band} onDayClick={setSelectedDate} />}
      {view.section === 'playlists' &&
        (view.playlistId ? (
          <PlaylistDetail
            band={band}
            playlistId={view.playlistId}
            apply={apply}
            onOpenSong={(songId) => setView({ section: 'songs', songId })}
            onBack={() => setView({ section: 'playlists' })}
          />
        ) : (
          <PlaylistsView band={band} apply={apply} onOpenPlaylist={openPlaylist} />
        ))}
      {view.section === 'songs' &&
        (view.songId ? (
          <SongDetail
            band={band}
            songId={view.songId}
            apply={apply}
            onOpenPlaylist={openPlaylist}
            onBack={() => setView({ section: 'songs' })}
          />
        ) : (
          <SongsView band={band} apply={apply} onOpenSong={(songId) => setView({ section: 'songs', songId })} />
        ))}
      {view.section === 'calendar' && selectedDate && (
        <DayEditorModal
          date={selectedDate}
          events={band.events}
          playlists={band.playlists}
          availability={band.availability}
          members={band.members}
          onToggle={handleToggle}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onOpenPlaylist={openPlaylist}
          onCreateEventPlaylist={handleCreateEventPlaylist}
          onLinkPlaylist={handleLinkPlaylist}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default App;
