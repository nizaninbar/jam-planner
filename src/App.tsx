import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { DayEditorModal } from './components/DayEditorModal';
import { createEvent, deleteEvent, getBand, setMemberAvailability } from './data/bandService';
import type { AvailabilityStatus, Band, EventType } from './types/band';
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

  const handleToggle = (memberId: string, nextStatus: AvailabilityStatus) => {
    if (!selectedDate) {
      return;
    }
    setMemberAvailability(band.id, memberId, toIsoDate(selectedDate), nextStatus)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleCreateEvent = (type: EventType, label: string, location?: string) => {
    if (!selectedDate) {
      return;
    }
    createEvent(band.id, toIsoDate(selectedDate), type, label, location)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(band.id, eventId)
      .then(setBand)
      .catch((err: Error) => setError(err.message));
  };

  return (
    <>
      <Calendar band={band} onDayClick={setSelectedDate} />
      {selectedDate && (
        <DayEditorModal
          date={selectedDate}
          events={band.events}
          availability={band.availability}
          members={band.members}
          onToggle={handleToggle}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}

export default App;
