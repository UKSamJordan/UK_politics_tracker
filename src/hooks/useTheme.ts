import { useEffect } from 'react';

export type Theme = 'dark';

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    try {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) {
        meta.setAttribute('content', 'dark');
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    theme: 'dark' as Theme,
    isDark: true,
    toggleTheme: () => {},
    setTheme: () => {},
  };
}

