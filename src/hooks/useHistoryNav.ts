import { useEffect, useRef } from 'react';

// Mirrors in-app navigation (view + open day modal) into the browser history, so the phone's back
// gesture/button steps back inside the app instead of leaving it. `state` must be JSON-serializable.
export function useHistoryNav<T>(state: T, restore: (state: T) => void, enabled: boolean) {
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });
  const popping = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const key = JSON.stringify(state);
    if (!started.current) {
      started.current = true;
      window.history.replaceState({ nav: key }, '');
      return;
    }
    if (popping.current) {
      popping.current = false;
      return;
    }
    if ((window.history.state as { nav?: string } | null)?.nav !== key) {
      window.history.pushState({ nav: key }, '');
    }
  }, [state, enabled]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const nav = (e.state as { nav?: string } | null)?.nav;
      if (!nav) {
        return;
      }
      popping.current = true;
      restoreRef.current(JSON.parse(nav) as T);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
