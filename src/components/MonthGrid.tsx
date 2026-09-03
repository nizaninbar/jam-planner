import type { Band, Member } from '../types/band';
import { getDayStatus } from '../utils/calendar';
import { DayCell } from './DayCell';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
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
      <h2 className="month-title">
        {MONTH_NAMES[month]} {year}
      </h2>
      <div className="grid">
        {DAY_NAMES.map((name) => (
          <div className="day-name" key={name}>
            {name}
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
