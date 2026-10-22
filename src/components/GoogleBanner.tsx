import { useState } from 'react';

interface GoogleBannerProps {
  onAttach: () => void;
}

// Shown on every load until Google is attached; dismissing only hides it for this visit.
export function GoogleBanner({ onAttach }: GoogleBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) {
    return null;
  }
  return (
    <div className="banner" role="status">
      <span>צרף חשבון Google כדי להיכנס בקלות מכל מכשיר.</span>
      <button type="button" className="toggle-btn toggle-available" onClick={onAttach}>
        צרף Google
      </button>
      <button type="button" className="icon-btn" onClick={() => setDismissed(true)} aria-label="סגור">
        ✕
      </button>
    </div>
  );
}
