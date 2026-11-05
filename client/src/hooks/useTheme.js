import { useCallback, useState } from 'react';

const STORAGE_KEY = 'theme';
const BAR_COLOR = { light: '#0A2259', dark: '#0B1428' };

// Light or dark mode. index.html applies the saved mode before the first paint, so read it from there.
export default function useTheme() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));

  const toggleTheme = useCallback(() => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOR[next]);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the mode still applies until the page reloads.
    }
    setTheme(next);
  }, []);

  return { theme, toggleTheme };
}
