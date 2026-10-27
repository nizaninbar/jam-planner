import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallStatus = 'installed' | 'available' | 'ios' | 'unavailable';

// The browser fires this once, early, so it's captured at module load rather than when the menu opens.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function currentStatus(): InstallStatus {
  if (isStandalone()) {
    return 'installed';
  }
  if (deferred) {
    return 'available';
  }
  return isIos() ? 'ios' : 'unavailable';
}

// `install` shows the browser's install dialog (Chrome/Edge/Android). iOS has no such API, so the
// caller shows "Share → Add to Home Screen" instead.
export function useInstallPrompt(): [InstallStatus, () => Promise<void>] {
  const [status, setStatus] = useState<InstallStatus>(currentStatus);

  useEffect(() => {
    const update = () => setStatus(currentStatus());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) {
      return;
    }
    const event = deferred;
    deferred = null;
    await event.prompt();
    await event.userChoice;
    listeners.forEach((l) => l());
  }, []);

  return [status, install];
}
