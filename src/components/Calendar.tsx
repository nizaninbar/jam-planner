import { useEffect, useRef, useState } from 'react';
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
  const [legendOpen, setLegendOpen] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!legendOpen) {
      return;
    }
    const close = (e: Event) => {
      if (e.type === 'keydown' || !legendRef.current?.contains(e.target as Node)) {
        setLegendOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(e);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [legendOpen]);

  return (
    <div className="calendar-container">
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
        <div className="legend-wrap" ref={legendRef}>
          <button
            type="button"
            className="legend-toggle"
            aria-label="מקרא"
            aria-expanded={legendOpen}
            onClick={() => setLegendOpen((o) => !o)}
          >
            ⓘ
          </button>
          {legendOpen && <Legend />}
        </div>
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
