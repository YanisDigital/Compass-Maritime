import { useCallback, useEffect, useState } from 'react';

export type Theme = 'auto' | 'light' | 'dark' | 'night';

export interface Settings {
  ship: string;
  defaultVariation: string;
  defaultVariationEW: 'E' | 'W';
  theme: Theme;
}

const DEFAULTS: Settings = {
  ship: '',
  defaultVariation: '',
  defaultVariationEW: 'E',
  theme: 'auto',
};

const KEY = 'compass-error.settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // A full or blocked store must not stop the calculation working.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return [settings, update];
}
