import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles, type Theme } from '../../theme';

export interface CardProps {
  children: ReactNode;
  /** Adds a soft ambient shadow per the design system spec. */
  elevation?: 0 | 1 | 2;
  /** Make the whole card tappable. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Surface container. Levels:
 *   0 — flush, no shadow (sub-card / nested)
 *   1 — default card with soft ambient shadow
 *   2 — modal / floating overlay with more pronounced shadow
 */
export function Card({ children, elevation = 1, onPress, style }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  const base = [styles.base, elevation === 1 && styles.elev1, elevation === 2 && styles.elev2, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...base, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    elev1: {
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.18 : 0.04,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    elev2: {
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.32 : 0.08,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    pressed: { opacity: 0.92 },
  });
}
