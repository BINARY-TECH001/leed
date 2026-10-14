import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS, ThemeColors } from '@/constants/theme';
import { CONFIG } from '@/constants/Config';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.THEME_PREFERENCE);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreferenceState(stored);
        }
      } catch (err) {
        console.error('Failed to load theme preference', err);
      }
    };
    loadStoredTheme();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      setThemePreferenceState(pref);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.THEME_PREFERENCE, pref);
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
  };

  const theme: 'light' | 'dark' =
    themePreference === 'system'
      ? deviceColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference,
        setThemePreference,
        colors,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
