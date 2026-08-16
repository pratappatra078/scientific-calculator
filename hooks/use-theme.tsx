import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { themes, type ThemeColors } from '@/constants/theme';

export type { ThemeColors };

export type ThemePreference = 'light' | 'dark' | 'system';

export type ThemeMode = 'light' | 'dark';

const THEME_PREFERENCE_KEY = '@pratap-calculator/theme-preference';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((raw) => {
        if (!mounted || !raw) {
          return;
        }
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setPreferenceState(raw);
        }
      })
      .catch(() => {
        // Ignore storage read failures; fall back to system theme.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, next).catch(() => {
      // Ignore storage write failures; the in-memory preference still applies.
    });
  };

  const value = useMemo(() => ({ preference, setPreference }), [preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextValue {
  return useContext(ThemeContext);
}

function resolveMode(preference: ThemePreference, system: 'light' | 'dark' | null | undefined): ThemeMode {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function useThemeMode(): ThemeMode {
  const { preference } = useThemePreference();
  const system = useColorScheme();
  return resolveMode(preference, system);
}

export function useTheme(): ThemeColors {
  return themes[useThemeMode()];
}
