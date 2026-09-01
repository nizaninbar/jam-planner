import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { DayEditorModal } from './components/DayEditorModal';
import { getBand, setMemberAvailability } from './data/bandService';
import type { AvailabilityStatus, Band } from './types/band';
import { toIsoDate } from './utils/calendar';

function App() {
  const [band, setBand] = useState<Band | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    getBand('main-band')
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <div className="loading">שגיאה בטעינת הנתונים: {error}</div>;
  }

  if (!band) {
    return <div className="loading">טוען...</div>;
  }

  const period = band.periods[0];

  const handleToggle = (memberId: string, nextStatus: AvailabilityStatus) => {
    if (!selectedDate) {
      return;
    }
    setMemberAvailability(band.id, period.id, memberId, toIsoDate(selectedDate), nextStatus)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  return (
    <>
      <Calendar band={band} period={period} onDayClick={setSelectedDate} />
      {selectedDate && (
        <DayEditorModal
          date={selectedDate}
          period={period}
          members={band.members}
          onToggle={handleToggle}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}

export default App;
