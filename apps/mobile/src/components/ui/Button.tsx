import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme, useThemedStyles, type Theme, type ThemeColors } from '../../theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'pill' | 'rounded';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Text label — convenience alternative to children. */
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Corner shape. `'pill'` (default) — fully rounded. `'rounded'` — radius.md (12px). */
  shape?: ButtonShape;
  loading?: boolean;
  /** Stretches button to fill its container width. */
  fullWidth?: boolean;
  /** Icon node rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon node rendered after the label. */
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * Maps each variant → which color token from `theme.colors` is used for the
 * label text AND the loading spinner. No raw hex values — everything resolves
 * through the active theme, so dark mode + future palette tweaks just work.
 */
const LABEL_TOKEN: Record<ButtonVariant, keyof ThemeColors> = {
  primary: 'onPrimary',
  secondary: 'primary',
  tertiary: 'onTertiary',
  ghost: 'primary',
  danger: 'onPrimary',
};

/**
 * Pill-shaped action button. Variants follow the Organic Modernist system:
 *   primary    — solid Sage with white text (default)
 *   secondary  — Sage outline, transparent fill
 *   tertiary   — solid Terracotta accent
 *   ghost      — text-only, used for inline links
 *   danger     — solid error red
 */
export function Button({
  children,
  label,
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isDisabled = disabled || loading;
  const labelToken = LABEL_TOKEN[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`shape_${shape}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors[labelToken]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          {label ? (
            <Text variant={size === 'sm' ? 'labelLg' : 'bodyLg'} color={labelToken}>
              {label}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      alignSelf: 'flex-start',
    },
    // shapes
    shape_pill: { borderRadius: theme.radius.full },
    shape_rounded: { borderRadius: theme.radius.md },
    fullWidth: { alignSelf: 'stretch' },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    icon: { alignItems: 'center', justifyContent: 'center' },

    // sizes
    size_sm: { paddingHorizontal: theme.spacing.md, paddingVertical: 6, minHeight: 32 },
    size_md: { paddingHorizontal: theme.spacing.lg, paddingVertical: 10, minHeight: 44 },
    size_lg: { paddingHorizontal: theme.spacing.xl, paddingVertical: 14, minHeight: 52 },

    // variants
    variant_primary: { backgroundColor: theme.colors.primary },
    variant_secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    variant_tertiary: { backgroundColor: theme.colors.tertiary },
    variant_ghost: { backgroundColor: 'transparent' },
    variant_danger: { backgroundColor: theme.colors.danger },
  });
}
