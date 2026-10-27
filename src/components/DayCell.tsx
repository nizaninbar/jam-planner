import { isPast, isToday, MONTH_NAMES, type DayStatus } from '../utils/calendar';

interface DayCellProps {
  date: Date;
  status: DayStatus;
  onClick?: () => void;
}

const EVENT_DISPLAY = {
  gig: { icon: '🎸', className: 'status-gig', name: 'הופעה' },
  'rehearsal-guided': { icon: '🎤', className: 'status-rehearsal', name: 'חזרה' },
  'rehearsal-band-only': { icon: '🎶', className: 'status-rehearsal', name: 'חזרה' },
};

export function DayCell({ date, status, onClick }: DayCellProps) {
  const dayNumber = date.getDate();
  const dateLabel = `${dayNumber} ב${MONTH_NAMES[date.getMonth()]}`;
  const today = isToday(date);
  const stateClasses = `${today ? ' is-today' : ''}${isPast(date) ? ' is-past' : ''}`;

  if (status.kind === 'event') {
    const { icon, className, name } = EVENT_DISPLAY[status.event.type];
    return (
      <button
        type="button"
        className={`day-cell ${className}${stateClasses}`}
        onClick={onClick}
        aria-label={`${dateLabel}, ${name}: ${status.event.label}`}
      >
        <span className="date-number">{dayNumber}</span>
        <span className="gig-label cell-detail">
          <span>{icon}</span> {status.event.label}
        </span>
        <span className="cell-compact" aria-hidden="true">
          {icon}
        </span>
      </button>
    );
  }

  if (status.kind === 'missing') {
    const names = status.missingMembers.map((member) => member.name).join(', ');
    return (
      <button
        type="button"
        className={`day-cell status-missing${stateClasses}`}
        onClick={onClick}
        aria-label={`${dateLabel}, חסרים: ${names}`}
      >
        <span className="date-number">{dayNumber}</span>
        <span className="missing-names cell-detail">
          {status.missingMembers.map((member) => (
            <span key={member.id}>❌ {member.name}</span>
          ))}
        </span>
        <span className="cell-compact cell-badge" aria-hidden="true">
          ‑{status.missingMembers.length}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`day-cell status-all-clear${stateClasses}`}
      onClick={onClick}
      aria-label={`${dateLabel}, כולם פנויים`}
    >
      <span className="date-number">{dayNumber}</span>
      <span className="status-text cell-detail">✓ כולם פנויים</span>
    </button>
  );
}
