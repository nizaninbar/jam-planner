export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Theme, string> = { dark: '#1a1024', light: '#fdf0d8' };

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getInitialTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : (getStoredTheme() ?? getSystemTheme());
}

/** Applies the theme to the page and the browser chrome colour. Pass `persist` for a user's explicit choice. */
export function applyTheme(theme: Theme, persist = false): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only.
    }
  }
}

/** With no stored choice, follows the system setting as it changes. Returns an unsubscribe. */
export function followSystemTheme(onApplied?: (theme: Theme) => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    if (getStoredTheme()) return;
    const theme: Theme = query.matches ? 'light' : 'dark';
    applyTheme(theme);
    onApplied?.(theme);
  };
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
