import type { DayStatus } from '../utils/calendar';

interface DayCellProps {
  date: Date;
  status: DayStatus;
  onClick?: () => void;
}

export function DayCell({ date, status, onClick }: DayCellProps) {
  const dayNumber = date.getDate();

  if (status.kind === 'gig') {
    return (
      <div className="day-cell status-gig" onClick={onClick}>
        <div className="date-number">{dayNumber}</div>
        <div className="gig-label">
          <span>🎸</span> {status.gig.label}
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
