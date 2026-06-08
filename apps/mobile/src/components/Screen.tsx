import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type Theme } from '../theme';

type SpacingKey = keyof Theme['spacing'];
type SpacingValue = SpacingKey | 'none';

export interface ScreenProps {
  /** Container variant. Default `'view'`. */
  variant?: 'scroll' | 'view' | 'keyboard';
  /**
   * Shorthand for `paddingX` and `paddingY`. If set, applies to both axes.
   * Individual `paddingX` / `paddingY` props take precedence.
   */
  padding?: SpacingValue;
  /** Horizontal padding. Default `'md'` (16px). */
  paddingX?: SpacingValue;
  /** Vertical padding. Default `'lg'` (24px). */
  paddingY?: SpacingValue;
  /** Vertical gap between direct children. */
  gap?: SpacingKey;
  /** Vertically center the content (mostly useful with `keyboard` variant). */
  centered?: boolean;
  /** Which safe-area edges to respect. Default top + bottom. */
  edges?: readonly Edge[];
  /** Extra styles merged into the content container. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Common screen scaffold: `SafeAreaView` background + a content container
 * that switches between `ScrollView`, `KeyboardAvoidingView`, or plain `View`
 * based on `variant`.
 *
 * Padding model:
 *   - `paddingX` defaults to `md` (16px)
 *   - `paddingY` defaults to `lg` (24px)
 *   - `padding` is a shorthand that sets both; per-axis props override it.
 */
export function Screen({
  variant = 'view',
  padding,
  paddingX,
  paddingY,
  gap,
  centered = false,
  edges = ['top', 'bottom'],
  style,
  children,
}: ScreenProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const px = paddingX ?? padding ?? 'md';
  const py = paddingY ?? padding ?? 'lg';

  const contentStyle: StyleProp<ViewStyle> = [
    px !== 'none' && { paddingHorizontal: theme.spacing[px] },
    py !== 'none' && { paddingVertical: theme.spacing[py] },
    gap !== undefined && { gap: theme.spacing[gap] },
    centered && styles.centered,
    style,
  ];

  if (variant === 'scroll') {
    return (
      <SafeAreaView style={styles.safe} edges={edges}>
        <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  if (variant === 'keyboard') {
    return (
      <SafeAreaView style={styles.safe} edges={edges}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.fill, contentStyle]}
        >
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.fill, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    fill: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center' },
  });
}
