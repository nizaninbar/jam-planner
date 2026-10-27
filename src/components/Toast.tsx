import { useEffect } from 'react';

const AUTO_DISMISS_MS = 6000;

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

// The aria-live region stays mounted so screen readers announce messages as they appear.
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast">
          <span>{message}</span>
          <button type="button" className="toast-close" onClick={onDismiss} aria-label="סגור הודעה">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
