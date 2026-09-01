import type { Band, Period } from '../types/band';
import { getMonthsInRange } from '../utils/calendar';
import { Legend } from './Legend';
import { MonthGrid } from './MonthGrid';

interface CalendarProps {
  band: Band;
  period: Period;
  onDayClick: (date: Date) => void;
}

export function Calendar({ band, period, onDayClick }: CalendarProps) {
  const months = getMonthsInRange(period.startDate, period.endDate);

  return (
    <div className="calendar-container">
      <div className="header">
        <h1>🗓️ לוח זמינות להקה</h1>
        <p>{period.name}</p>
      </div>

      <Legend />

      {months.map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          period={period}
          members={band.members}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
