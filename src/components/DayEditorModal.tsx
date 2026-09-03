import { useEffect, useState } from 'react';
import type { Availability, AvailabilityStatus, Event, EventType, Member } from '../types/band';
import { getMemberStatus, toIsoDate } from '../utils/calendar';

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
  availability: Availability[];
  members: Member[];
  onToggle: (memberId: string, nextStatus: AvailabilityStatus) => void;
  onCreateEvent: (type: EventType, label: string, location?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onClose: () => void;
}

export function DayEditorModal({
  date,
  events,
  availability,
  members,
  onToggle,
  onCreateEvent,
  onDeleteEvent,
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
          <div className="event-section">
            <div className="event-info">
              <div className="event-info-label">{EVENT_TYPE_LABELS[existingEvent.type]} - {existingEvent.label}</div>
              {existingEvent.location && <div className="event-info-location">📍 {existingEvent.location}</div>}
            </div>
            <button type="button" className="modal-close" onClick={() => onDeleteEvent(existingEvent.id)} aria-label="הסר אירוע">
              ✕
            </button>
          </div>
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
