import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Availability, AvailabilityStatus, Event, EventType, Member, Playlist } from '../types/band';
import { getMemberStatus, MONTH_NAMES, toIsoDate } from '../utils/calendar';
import { getPlaylistForEvent } from '../utils/playlists';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gig: 'הופעה',
  'rehearsal-guided': 'חזרה מודרכת',
  'rehearsal-band-only': 'חזרה של הלהקה',
};

// <input type="datetime-local"> speaks local time without a zone; the DB stores a real instant.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatReminder(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

interface DayEditorModalProps {
  date: Date;
  events: Event[];
  playlists: Playlist[];
  availability: Availability[];
  members: Member[];
  currentMemberId?: string;
  canEditContent: boolean;
  canEditAvailability: (memberId: string) => boolean;
  pendingMemberIds: ReadonlySet<string>;
  onToggle: (memberId: string, nextStatus: AvailabilityStatus) => void;
  onCreateEvent: (type: EventType, label: string, location?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onCreateEventPlaylist: (eventId: string, name: string) => void;
  onLinkPlaylist: (playlistId: string, eventId: string) => void;
  onSetReminder: (eventId: string, remindAt: string | null) => void;
  onClose: () => void;
}

export function DayEditorModal({
  date,
  events,
  playlists,
  availability,
  members,
  currentMemberId,
  canEditContent,
  canEditAvailability,
  pendingMemberIds,
  onToggle,
  onCreateEvent,
  onDeleteEvent,
  onOpenPlaylist,
  onCreateEventPlaylist,
  onLinkPlaylist,
  onSetReminder,
  onClose,
}: DayEditorModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<EventType>('rehearsal-band-only');
  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');
  const [titleError, setTitleError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Move focus in on open, give it back to the opener on close, and stop the page behind from scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>('button:not(.modal-close):not(:disabled), input, select') ??
      panel?.querySelector<HTMLElement>('.modal-close');
    first?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

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
  const eventPlaylist = existingEvent ? getPlaylistForEvent(existingEvent, playlists) : undefined;

  const handleDelete = (event: Event) => {
    if (window.confirm(`למחוק את "${event.label}"? הקישור לפלייליסט והתזכורת יוסרו גם הם.`)) {
      onDeleteEvent(event.id);
    }
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setTitleError(true);
      return;
    }
    onCreateEvent(type, label.trim(), location.trim() || undefined);
    setIsAdding(false);
    setLabel('');
    setLocation('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>
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
            </div>
            <div className="event-playlist">
              {eventPlaylist ? (
                <button type="button" className="add-event-btn" onClick={() => onOpenPlaylist(eventPlaylist.id)}>
                  🎵 {eventPlaylist.name}
                </button>
              ) : canEditContent ? (
                <>
                  <button
                    type="button"
                    className="add-event-btn"
                    onClick={() => onCreateEventPlaylist(existingEvent.id, existingEvent.label)}
                  >
                    + צור פלייליסט לאירוע
                  </button>
                  {playlists.length > 0 && (
                    <select
                      value=""
                      className="event-playlist-select"
                      onChange={(e) => e.target.value && onLinkPlaylist(e.target.value, existingEvent.id)}
                    >
                      <option value="">או קשר פלייליסט קיים…</option>
                      {playlists.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              ) : null}
            </div>
            {canEditContent ? (
              <div className="event-reminder">
                <label>
                  🔔 תזכורת
                  <input
                    type="datetime-local"
                    key={existingEvent.remindAt ?? 'none'}
                    defaultValue={existingEvent.remindAt ? toLocalInputValue(existingEvent.remindAt) : ''}
                    onBlur={(e) => {
                      const next = e.target.value ? new Date(e.target.value).toISOString() : null;
                      if (next !== (existingEvent.remindAt ? new Date(existingEvent.remindAt).toISOString() : null)) {
                        onSetReminder(existingEvent.id, next);
                      }
                    }}
                  />
                </label>
                {existingEvent.remindAt && (
                  <>
                    <span className="event-reminder-state">{existingEvent.reminderSent ? 'נשלחה ✓' : 'ממתינה'}</span>
                    <button type="button" className="text-btn" onClick={() => onSetReminder(existingEvent.id, null)}>
                      הסר תזכורת
                    </button>
                  </>
                )}
              </div>
            ) : (
              existingEvent.remindAt && (
                <div className="event-reminder">
                  🔔 תזכורת: {formatReminder(existingEvent.remindAt)}
                </div>
              )
            )}
            {canEditContent && (
              <button type="button" className="text-btn danger event-delete-btn" onClick={() => handleDelete(existingEvent)}>
                מחק אירוע
              </button>
            )}
          </>
        ) : !canEditContent ? null : isAdding ? (
          <form className="event-form form-stack" onSubmit={handleAdd} noValidate>
            <label>
              סוג
              <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
                <option value="rehearsal-band-only">חזרה של הלהקה</option>
                <option value="rehearsal-guided">חזרה מודרכת</option>
                <option value="gig">הופעה</option>
              </select>
            </label>
            <label>
              כותרת
              <input
                type="text"
                value={label}
                aria-invalid={titleError}
                aria-describedby={titleError ? `${titleId}-error` : undefined}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setTitleError(false);
                }}
              />
              {titleError && (
                <span id={`${titleId}-error`} className="error-text" role="alert">
                  צריך להזין כותרת
                </span>
              )}
            </label>
            <label>
              מיקום (אופציונלי)
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <div className="event-form-actions">
              <button type="submit" className="btn btn-primary">
                הוסף
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setTitleError(false);
                }}
              >
                ביטול
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="add-event-btn" onClick={() => setIsAdding(true)}>
            + הוסף אירוע
          </button>
        )}

        <div className="modal-divider" />

        {[...members]
          .sort((a, b) => Number(b.id === currentMemberId) - Number(a.id === currentMemberId))
          .map((member) => {
            const status = getMemberStatus(availability, member.id, date);
            const isAvailable = status === 'available';
            const editable = canEditAvailability(member.id);
            const isMe = member.id === currentMemberId;
            return (
              <div className={isMe ? 'modal-row modal-row-me' : 'modal-row'} key={member.id}>
                <span>{isMe ? `${member.name} (את/ה)` : member.name}</span>
                {editable ? (
                  <button
                    type="button"
                    className={isAvailable ? 'toggle-btn toggle-available' : 'toggle-btn toggle-unavailable'}
                    disabled={pendingMemberIds.has(member.id)}
                    data-autofocus={isMe ? '' : undefined}
                    onClick={() => onToggle(member.id, isAvailable ? 'unavailable' : 'available')}
                  >
                    {isAvailable ? '✓ פנוי/ה' : '✗ לא זמין/ה'}
                  </button>
                ) : (
                  <span className={isAvailable ? 'status-chip status-chip-available' : 'status-chip status-chip-unavailable'}>
                    {isAvailable ? '✓ פנוי/ה' : '✗ לא זמין/ה'}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
