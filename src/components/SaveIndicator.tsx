import type { SaveStatus } from '../hooks/useSaveStatus';

const TEXT: Record<Exclude<SaveStatus, 'idle'>, string> = {
  saving: 'שומר…',
  saved: 'נשמר ✓',
  error: 'השמירה נכשלה',
};

// Always rendered so the live region exists before its text changes.
export function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <p className={`save-indicator save-${status}`} role="status" aria-live="polite">
      {status === 'idle' ? '' : TEXT[status]}
    </p>
  );
}
