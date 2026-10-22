import { useEffect, useState } from 'react';
import { disablePush, enablePush, getPushStatus, type PushStatus } from '../data/pushService';

interface NotificationsBannerProps {
  bandId: string;
}

// Lets this device opt in to (or out of) reminders. The "send test" button was removed once setup was
// verified; pushService.sendTestPush and the function's { test: true } path remain if it's needed again.
export function NotificationsBanner({ bandId }: NotificationsBannerProps) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPushStatus().then(setStatus).catch(() => setStatus('unsupported'));
  }, []);

  const run = async (action: () => Promise<string | void>) => {
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
    setStatus(await getPushStatus().catch(() => 'unsupported' as const));
    setBusy(false);
  };

  if (status === null || status === 'unsupported') {
    return null;
  }

  return (
    <div className="banner" role="status">
      {status === 'on' ? (
        <>
          <span>{message ?? '🔔 התראות מופעלות במכשיר הזה.'}</span>
          <button type="button" className="icon-btn" disabled={busy} onClick={() => run(disablePush)} aria-label="כבה התראות" title="כבה התראות">
            🔕
          </button>
        </>
      ) : status === 'denied' ? (
        <span>ההתראות חסומות בדפדפן. אפשר לאפשר אותן בהגדרות האתר.</span>
      ) : (
        <>
          <span>{message ?? 'קבל תזכורת לאירועים ישירות לטלפון.'}</span>
          <button
            type="button"
            className="toggle-btn toggle-available"
            disabled={busy}
            onClick={() => run(() => enablePush(bandId))}
          >
            🔔 הפעל התראות
          </button>
        </>
      )}
    </div>
  );
}
