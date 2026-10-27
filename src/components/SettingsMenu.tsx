import { useEffect, useRef, useState } from 'react';
import { disablePush, enablePush, getPushStatus, type PushStatus } from '../data/pushService';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';

interface SettingsMenuProps {
  bandId: string;
  googleLinked: boolean;
  onAttachGoogle: () => void;
  onSignOut: () => void;
}

// Account/settings popover: Google, reminders, theme and sign-out. The dot on the button shows while
// Google isn't attached or reminders are still off on this device.
export function SettingsMenu({ bandId, googleLinked, onAttachGoogle, onSignOut }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [push, setPush] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getPushStatus().then(setPush).catch(() => setPush('unsupported'));
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (e: Event) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const runPush = async (action: () => Promise<string | void>) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      if (result) {
        setMessage(result);
      }
    } catch (err) {
      setMessage((err as Error).message);
    }
    setPush(await getPushStatus().catch(() => 'unsupported' as const));
    setBusy(false);
  };

  const needsAttention = !googleLinked || push === 'off';

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="theme-toggle settings-toggle"
        aria-label={needsAttention ? 'הגדרות (יש פעולות ממתינות)' : 'הגדרות'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="settings" />
        {needsAttention && <span className="dot-badge" aria-hidden="true" />}
      </button>
      {open && (
        <div className="settings-menu">
          {!googleLinked && (
            <div className="settings-row">
              <span>צרף חשבון Google כדי להיכנס בקלות מכל מכשיר.</span>
              <button type="button" className="toggle-btn toggle-available" onClick={onAttachGoogle}>
                צרף Google
              </button>
            </div>
          )}
          {push === 'off' && (
            <div className="settings-row">
              <span>{message ?? 'קבל תזכורת לאירועים ישירות לטלפון.'}</span>
              <button
                type="button"
                className="toggle-btn toggle-available"
                disabled={busy}
                onClick={() => void runPush(() => enablePush(bandId))}
              >
                <Icon name="bell" size={16} /> הפעל התראות
              </button>
            </div>
          )}
          {push === 'on' && (
            <div className="settings-row">
              <span>{message ?? 'התראות מופעלות במכשיר הזה.'}</span>
              <button type="button" className="icon-btn" disabled={busy} onClick={() => void runPush(disablePush)} aria-label="כבה התראות">
                <Icon name="bell-off" />
              </button>
            </div>
          )}
          {push === 'denied' && (
            <div className="settings-row">
              <span>ההתראות חסומות בדפדפן. אפשר לאפשר אותן בהגדרות האתר.</span>
            </div>
          )}
          <div className="settings-row">
            <span>מצב תצוגה</span>
            <ThemeToggle />
          </div>
          <button type="button" className="settings-item" onClick={onSignOut}>
            <Icon name="logout" /> התנתק
          </button>
        </div>
      )}
    </div>
  );
}
