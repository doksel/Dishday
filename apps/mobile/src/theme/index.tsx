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
import { Appearance, type ColorSchemeName, type TextStyle } from 'react-native';

// ─── Tokens ───────────────────────────────────────────────
// Palette: Organic Modernist (Sage Green + Cream + Terracotta).
// Generated from Material 3 tokens; see docs/design-system.md.

export interface ThemeColors {
  // Surfaces (cream → white tonal layering)
  background: string; // base — cream
  surface: string; // cards — white
  surfaceVariant: string; // alternate surface
  surfaceContainer: string;
  surfaceContainerHigh: string;

  // Text on surfaces
  text: string; // on-surface
  textSecondary: string; // on-surface-variant
  textMuted: string; // outline / lighter
  textInverse: string; // for use over dark surfaces

  // Brand (Sage)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  /** 10% opacity Sage — for chip backgrounds, subtle tints */
  primaryTint: string;

  // Accent (Terracotta)
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Semantic
  success: string;
  danger: string;
  warning: string;

  // Borders / outlines
  border: string; // outline-variant
  borderStrong: string; // outline

  // Inputs
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Tab bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarBorder: string;
}

export interface ThemeTypography {
  displayLg: TextStyle;
  headlineLg: TextStyle;
  headlineMd: TextStyle;
  bodyLg: TextStyle;
  bodyMd: TextStyle;
  labelLg: TextStyle;
  labelSm: TextStyle;
}

export interface ThemeSpacing {
  base: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  containerMargin: number;
  gutter: number;
}

export interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
}

const spacing: ThemeSpacing = {
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  containerMargin: 20,
  gutter: 12,
};

const radius: ThemeRadius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const FONT_HEADING = 'PlusJakartaSans_700Bold';
const FONT_HEADING_SEMI = 'PlusJakartaSans_600SemiBold';
const FONT_BODY = 'WorkSans_400Regular';
const FONT_BODY_MED = 'WorkSans_500Medium';
const FONT_BODY_SEMI = 'WorkSans_600SemiBold';

const typography: ThemeTypography = {
  displayLg: {
    fontFamily: FONT_HEADING,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  headlineLg: {
    fontFamily: FONT_HEADING,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  headlineMd: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: FONT_BODY,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  labelLg: {
    fontFamily: FONT_BODY_SEMI,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  labelSm: {
    fontFamily: FONT_BODY_MED,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
};

// ─── Light theme ──────────────────────────────────────────

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#fcf8fb',
    surface: '#ffffff',
    surfaceVariant: '#f6f3f5',
    surfaceContainer: '#f0edef',
    surfaceContainerHigh: '#eae7ea',

    text: '#1b1b1d',
    textSecondary: '#3e4942',
    textMuted: '#6e7a72',
    textInverse: '#f3f0f2',

    primary: '#006c48',
    onPrimary: '#ffffff',
    primaryContainer: '#4caf82',
    onPrimaryContainer: '#003d27',
    primaryTint: 'rgba(0, 108, 72, 0.10)',

    tertiary: '#9a4523',
    onTertiary: '#ffffff',
    tertiaryContainer: '#e8825a',
    onTertiaryContainer: '#621e00',

    success: '#006c48',
    danger: '#ba1a1a',
    warning: '#9a4523',

    border: '#bdcac0',
    borderStrong: '#6e7a72',

    inputBackground: '#f6f3f5',
    inputBorder: '#bdcac0',
    placeholder: '#6e7a72',

    tabBarBackground: '#ffffff',
    tabBarActive: '#006c48',
    tabBarInactive: '#6e7a72',
    tabBarBorder: '#bdcac0',
  },
  typography,
  spacing,
  radius,
};

// ─── Dark theme ───────────────────────────────────────────
// Derived from Material 3 dark-mode pairings of the same source palette.

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#101412',
    surface: '#1a1f1c',
    surfaceVariant: '#222825',
    surfaceContainer: '#262d29',
    surfaceContainerHigh: '#2b3431',

    text: '#e4e2e4',
    textSecondary: '#bdcac0',
    textMuted: '#8b9990',
    textInverse: '#1b1b1d',

    primary: '#77d9a9',
    onPrimary: '#003d27',
    primaryContainer: '#005236',
    onPrimaryContainer: '#93f6c4',
    primaryTint: 'rgba(119, 217, 169, 0.16)',

    tertiary: '#ffb59a',
    onTertiary: '#621e00',
    tertiaryContainer: '#7b2e0d',
    onTertiaryContainer: '#ffdbcf',

    success: '#77d9a9',
    danger: '#ffb4ab',
    warning: '#ffb59a',

    border: '#3e4942',
    borderStrong: '#6e7a72',

    inputBackground: '#1a1f1c',
    inputBorder: '#3e4942',
    placeholder: '#8b9990',

    tabBarBackground: '#101412',
    tabBarActive: '#77d9a9',
    tabBarInactive: '#8b9990',
    tabBarBorder: '#222825',
  },
  typography,
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => undefined);
  }, []);

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

  const value = useMemo(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );

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
 * `makeStyles(theme)` factory should be defined at module scope so its
 * reference stays stable. Returns a memoised StyleSheet regenerated only
 * when the theme changes.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
