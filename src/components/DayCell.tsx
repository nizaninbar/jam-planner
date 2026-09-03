import type { DayStatus } from '../utils/calendar';

interface DayCellProps {
  date: Date;
  status: DayStatus;
  onClick?: () => void;
}

const EVENT_DISPLAY = {
  gig: { icon: '🎸', className: 'status-gig' },
  'rehearsal-guided': { icon: '🎤', className: 'status-rehearsal' },
  'rehearsal-band-only': { icon: '🎶', className: 'status-rehearsal' },
};

export function DayCell({ date, status, onClick }: DayCellProps) {
  const dayNumber = date.getDate();

  if (status.kind === 'event') {
    const { icon, className } = EVENT_DISPLAY[status.event.type];
    return (
      <div className={`day-cell ${className}`} onClick={onClick}>
        <div className="date-number">{dayNumber}</div>
        <div className="gig-label">
          <span>{icon}</span> {status.event.label}
        </div>
      </div>
    );
  }

  if (status.kind === 'missing') {
    return (
      <div className="day-cell status-missing" onClick={onClick}>
        <div className="date-number">{dayNumber}</div>
        <div className="missing-names">
          {status.missingMembers.map((member) => (
            <div key={member.id}>❌ {member.name}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="day-cell status-all-clear" onClick={onClick}>
      <div className="date-number">{dayNumber}</div>
      <div className="status-text">✓ כולם פנויים</div>
    </div>
  );
}
