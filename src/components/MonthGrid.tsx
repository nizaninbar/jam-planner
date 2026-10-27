import type { Band, Member } from '../types/band';
import { getDayStatus } from '../utils/calendar';
import { DayCell } from './DayCell';

const DAY_NAMES = [
  { full: 'ראשון', short: 'א׳' },
  { full: 'שני', short: 'ב׳' },
  { full: 'שלישי', short: 'ג׳' },
  { full: 'רביעי', short: 'ד׳' },
  { full: 'חמישי', short: 'ה׳' },
  { full: 'שישי', short: 'ו׳' },
  { full: 'שבת', short: 'ש׳' },
];

interface MonthGridProps {
  year: number;
  month: number;
  band: Band;
  members: Member[];
  onDayClick: (date: Date) => void;
}

export function MonthGrid({ year, month, band, members, onDayClick }: MonthGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  return (
    <div className="month-section">
      <div className="grid">
        {DAY_NAMES.map((name) => (
          <div className="day-name" key={name.full}>
            <span className="day-name-full">{name.full}</span>
            <span className="day-name-short" aria-hidden="true">
              {name.short}
            </span>
          </div>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div className="day-cell empty" key={`blank-${i}`} />
        ))}
        {days.map((date) => (
          <DayCell
            key={date.getDate()}
            date={date}
            status={getDayStatus(band, members, date)}
            onClick={() => onDayClick(date)}
          />
        ))}
      </div>
    </div>
  );
}
