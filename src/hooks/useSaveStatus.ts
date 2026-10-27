import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Tracks one save at a time for a field group. `run` takes the promise `apply` returns (true = saved);
// "saved" fades back to idle after a moment.
export function useSaveStatus(): [SaveStatus, (save: Promise<boolean> | void) => void] {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((save: Promise<boolean> | void) => {
    if (!save) {
      return;
    }
    window.clearTimeout(timer.current);
    setStatus('saving');
    void save.then((ok) => {
      setStatus(ok ? 'saved' : 'error');
      timer.current = window.setTimeout(() => setStatus('idle'), 2500);
    });
  }, []);

  return [status, run];
}
