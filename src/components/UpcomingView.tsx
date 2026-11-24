import type { Band, Event } from '../types/band';
import { formatEventDate, isToday, MONTH_NAMES, parseIsoDate } from '../utils/calendar';
import { EVENT_DISPLAY, EVENT_TYPE_LABELS, getUpcomingEvents } from '../utils/events';
import { getPlaylistForEvent } from '../utils/playlists';

interface UpcomingViewProps {
  band: Band;
  onOpenDay: (date: string) => void;
}

function groupByMonth(events: Event[]): { key: string; title: string; events: Event[] }[] {
  const groups: { key: string; title: string; events: Event[] }[] = [];
  for (const event of events) {
    const key = event.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const d = parseIsoDate(event.date);
      group = { key, title: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, events: [] };
      groups.push(group);
    }
    group.events.push(event);
  }
  return groups;
}

export function UpcomingView({ band, onOpenDay }: UpcomingViewProps) {
  const groups = groupByMonth(getUpcomingEvents(band.events));

  return (
    <div className="page-container">
      <h2 className="page-title">אירועים קרובים</h2>

      {groups.length === 0 && <p className="muted">אין אירועים קרובים.</p>}

      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="section-title">{group.title}</h3>
          <ul className="item-list">
            {group.events.map((event) => {
              const { icon, className } = EVENT_DISPLAY[event.type];
              const playlist = getPlaylistForEvent(event, band.playlists);
              const today = isToday(parseIsoDate(event.date));
              return (
                <li key={event.id}>
                  <button type="button" className={`list-item upcoming-item ${className}`} onClick={() => onOpenDay(event.date)}>
                    <span className="list-item-title">
                      {icon} {EVENT_TYPE_LABELS[event.type]} - {event.label}
                    </span>
                    <span className="list-item-meta">
                      {today ? 'היום' : formatEventDate(event.date)}
                      {event.time && (
                        <>
                          {' · 🕐 '}
                          <span dir="ltr">{event.time}</span>
                        </>
                      )}
                      {event.location && ` · 📍 ${event.location}`}
                      {playlist && ` · 🎵 ${playlist.name}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
