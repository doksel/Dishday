import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

// ─── Tokens ───────────────────────────────────────────────

export interface ThemeColors {
  // backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;

  // text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // brand
  primary: string;
  primaryHover: string;
  onPrimary: string;

  // semantic
  success: string;
  danger: string;
  warning: string;

  // borders
  border: string;
  borderStrong: string;

  // inputs
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // tab bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarBorder: string;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number; full: number };
}

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
const radius = { sm: 6, md: 10, lg: 14, full: 999 };

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f4f4f5',

    text: '#18181b',
    textSecondary: '#52525b',
    textMuted: '#a1a1aa',
    textInverse: '#ffffff',

    primary: '#4f46e5',
    primaryHover: '#4338ca',
    onPrimary: '#ffffff',

    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',

    border: '#e4e4e7',
    borderStrong: '#d4d4d8',

    inputBackground: '#ffffff',
    inputBorder: '#d4d4d8',
    placeholder: '#a1a1aa',

    tabBarBackground: '#ffffff',
    tabBarActive: '#4f46e5',
    tabBarInactive: '#71717a',
    tabBarBorder: '#e4e4e7',
  },
  spacing,
  radius,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#09090b',
    surface: '#18181b',
    surfaceVariant: '#27272a',

    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textInverse: '#18181b',

    primary: '#818cf8',
    primaryHover: '#a5b4fc',
    onPrimary: '#1e1b4b',

    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',

    border: '#27272a',
    borderStrong: '#3f3f46',

    inputBackground: '#18181b',
    inputBorder: '#3f3f46',
    placeholder: '#52525b',

    tabBarBackground: '#09090b',
    tabBarActive: '#818cf8',
    tabBarInactive: '#71717a',
    tabBarBorder: '#27272a',
  },
  spacing,
  radius,
};

// ─── Provider ─────────────────────────────────────────────

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'dishday.themePreference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load saved preference once on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => undefined);
  }, []);

  // React to OS-level appearance changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => undefined);
  }, []);

  const theme = useMemo<Theme>(() => {
    const effective = preference === 'system' ? (systemScheme ?? 'light') : preference;
    return effective === 'dark' ? darkTheme : lightTheme;
  }, [preference, systemScheme]);

  const value = useMemo(() => ({ theme, preference, setPreference }), [theme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used inside <ThemeProvider>');
  return { preference: ctx.preference, setPreference: ctx.setPreference };
}

/**
 * Theme-aware StyleSheet hook.
 * Pass a `makeStyles(theme)` factory (defined at module scope so its reference
 * is stable). Returns a memoised StyleSheet that's regenerated only when the
 * theme changes.
 *
 * ```tsx
 * const styles = useThemedStyles(makeStyles);
 *
 * function makeStyles(theme: Theme) {
 *   return StyleSheet.create({
 *     container: { flex: 1, backgroundColor: theme.colors.background },
 *   });
 * }
 * ```
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
