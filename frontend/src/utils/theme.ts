export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'smart-list-theme';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function getInitialTheme(): ThemePreference {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
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
