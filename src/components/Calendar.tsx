import { useState } from 'react';
import type { Band } from '../types/band';
import { Legend } from './Legend';
import { MonthGrid } from './MonthGrid';

interface CalendarProps {
  band: Band;
  onDayClick: (date: Date) => void;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function Calendar({ band, onDayClick }: CalendarProps) {
  const today = new Date();
  const [visible, setVisible] = useState({ year: today.getFullYear(), month: today.getMonth() });

  return (
    <div className="calendar-container">
      <div className="header">
        <h1>🗓️ לוח זמינות להקה</h1>
        <p>{band.name}</p>
      </div>

      <Legend />

      <div className="month-nav">
        <button type="button" onClick={() => setVisible((v) => shiftMonth(v.year, v.month, -1))}>
          ‹ הקודם
        </button>
        <button type="button" onClick={() => setVisible({ year: today.getFullYear(), month: today.getMonth() })}>
          היום
        </button>
        <button type="button" onClick={() => setVisible((v) => shiftMonth(v.year, v.month, 1))}>
          הבא ›
        </button>
      </div>

      <MonthGrid
        year={visible.year}
        month={visible.month}
        band={band}
        members={band.members}
        onDayClick={onDayClick}
      />
    </div>
  );
}
