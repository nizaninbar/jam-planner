import { useEffect } from 'react';
import type { Availability, AvailabilityStatus, Member } from '../types/band';
import { getMemberStatus } from '../utils/calendar';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

interface DayEditorModalProps {
  date: Date;
  availability: Availability[];
  members: Member[];
  onToggle: (memberId: string, nextStatus: AvailabilityStatus) => void;
  onClose: () => void;
}

export function DayEditorModal({ date, availability, members, onToggle, onClose }: DayEditorModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {date.getDate()} ב{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        {members.map((member) => {
          const status = getMemberStatus(availability, member.id, date);
          const isAvailable = status === 'available';
          return (
            <div className="modal-row" key={member.id}>
              <span>{member.name}</span>
              <button
                type="button"
                className={isAvailable ? 'toggle-btn toggle-available' : 'toggle-btn toggle-unavailable'}
                onClick={() => onToggle(member.id, isAvailable ? 'unavailable' : 'available')}
              >
                {isAvailable ? '✓ פנוי/ה' : '✗ לא זמין/ה'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
