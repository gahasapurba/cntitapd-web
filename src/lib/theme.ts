/**
 * Light/dark theme. A visitor's explicit choice (theme toggle) is remembered; until they make
 * one the site follows the operating system setting. index.html applies the same rule before
 * React loads, so the first paint already has the right theme.
 */
export type Theme = 'light' | 'dark';

/** Only set when the visitor picks a theme. (The old `cnt_theme` key was written on every
 * visit, so it says nothing about a choice and is ignored.) */
const CHOICE_KEY = 'cnt_theme_choice';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(CHOICE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(CHOICE_KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
}

export function getSystemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

export function getInitialTheme(): Theme {
  return getSavedTheme() ?? getSystemTheme();
}

/** Calls `onChange` when the OS theme changes. Returns an unsubscribe function. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.(DARK_QUERY);
  if (!query) return () => {};
  const listener = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
