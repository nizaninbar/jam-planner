import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { applyTheme, followSystemTheme, getInitialTheme, type Theme } from '../utils/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(
    () =>
      followSystemTheme((next) => {
        setTheme(next);
      }),
    [],
  );

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
