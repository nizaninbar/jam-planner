import { useEffect, useState } from 'react';
import type { Availability, AvailabilityStatus, Event, EventType, Member, Playlist } from '../types/band';
import { getMemberStatus, toIsoDate } from '../utils/calendar';
import { getPlaylistForEvent } from '../utils/playlists';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gig: 'הופעה',
  'rehearsal-guided': 'חזרה מודרכת',
  'rehearsal-band-only': 'חזרה של הלהקה',
};

interface DayEditorModalProps {
  date: Date;
  events: Event[];
  playlists: Playlist[];
  availability: Availability[];
  members: Member[];
  onToggle: (memberId: string, nextStatus: AvailabilityStatus) => void;
  onCreateEvent: (type: EventType, label: string, location?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onCreateEventPlaylist: (eventId: string, name: string) => void;
  onLinkPlaylist: (playlistId: string, eventId: string) => void;
  onClose: () => void;
}

export function DayEditorModal({
  date,
  events,
  playlists,
  availability,
  members,
  onToggle,
  onCreateEvent,
  onDeleteEvent,
  onOpenPlaylist,
  onCreateEventPlaylist,
  onLinkPlaylist,
  onClose,
}: DayEditorModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<EventType>('rehearsal-band-only');
  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const existingEvent = events.find((e) => e.date === toIsoDate(date));
  const eventPlaylist = existingEvent ? getPlaylistForEvent(existingEvent.id, playlists) : undefined;
  const unlinkedPlaylists = playlists.filter((p) => !p.eventId);

  const handleAdd = () => {
    if (!label.trim()) {
      return;
    }
    onCreateEvent(type, label.trim(), location.trim() || undefined);
    setIsAdding(false);
    setLabel('');
    setLocation('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {date.getDate()} ב{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        {existingEvent ? (
          <>
            <div className="event-section">
              <div className="event-info">
                <div className="event-info-label">{EVENT_TYPE_LABELS[existingEvent.type]} - {existingEvent.label}</div>
                {existingEvent.location && <div className="event-info-location">📍 {existingEvent.location}</div>}
              </div>
              <button type="button" className="modal-close" onClick={() => onDeleteEvent(existingEvent.id)} aria-label="הסר אירוע">
                ✕
              </button>
            </div>
            <div className="event-playlist">
              {eventPlaylist ? (
                <button type="button" className="add-event-btn" onClick={() => onOpenPlaylist(eventPlaylist.id)}>
                  🎵 {eventPlaylist.name}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="add-event-btn"
                    onClick={() => onCreateEventPlaylist(existingEvent.id, existingEvent.label)}
                  >
                    + צור פלייליסט לאירוע
                  </button>
                  {unlinkedPlaylists.length > 0 && (
                    <select
                      value=""
                      className="event-playlist-select"
                      onChange={(e) => e.target.value && onLinkPlaylist(e.target.value, existingEvent.id)}
                    >
                      <option value="">או קשר פלייליסט קיים…</option>
                      {unlinkedPlaylists.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </>
        ) : isAdding ? (
          <div className="event-form">
            <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
              <option value="rehearsal-band-only">חזרה של הלהקה</option>
              <option value="rehearsal-guided">חזרה מודרכת</option>
              <option value="gig">הופעה</option>
            </select>
            <input type="text" placeholder="כותרת" value={label} onChange={(e) => setLabel(e.target.value)} />
            <input
              type="text"
              placeholder="מיקום (אופציונלי)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <div className="event-form-actions">
              <button type="button" className="toggle-btn toggle-available" onClick={handleAdd}>
                הוסף
              </button>
              <button type="button" className="modal-close" onClick={() => setIsAdding(false)}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="add-event-btn" onClick={() => setIsAdding(true)}>
            + הוסף אירוע
          </button>
        )}

        <div className="modal-divider" />

        {members.map((member) => {
          const status = getMemberStatus(availability, member.id, date);
          const isAvailable = status === 'available';
          return (
            <div className="modal-row" key={member.id}>
              <span>{member.name}</span>
              <button
                type="button"
                className={isAvailable ? 'toggle-btn toggle-available' : 'toggle-btn toggle-unavailable'}
                onClick={() => onToggle(member.id, isAvailable ? 'unavailable' : 'available')}
              >
                {isAvailable ? '✓ פנוי/ה' : '✗ לא זמין/ה'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
