import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY = 'smart-list-theme';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function getInitialTheme(): ThemePreference {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // localStorage may be blocked by user privacy settings
    }
  }
  return 'system';
}

export function applyThemeClass(preference: ThemePreference): 'light' | 'dark' {
  const resolved = preference === 'system' ? getSystemTheme() : preference;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
  return resolved;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => applyThemeClass(theme));

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore write errors
    }
    const resolved = applyThemeClass(newTheme);
    setResolvedTheme(resolved);
  };

  useEffect(() => {
    const resolved = applyThemeClass(theme);
    setResolvedTheme(resolved);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const currentResolved = applyThemeClass('system');
        setResolvedTheme(currentResolved);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
