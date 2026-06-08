import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, type Theme } from '../../theme';
import { Text } from './Text';

export type ChipVariant = 'tint' | 'solid' | 'outline';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  /** Sage by default. Set `'tertiary'` for terracotta accent. */
  tone?: 'primary' | 'tertiary' | 'neutral';
  selected?: boolean;
  /** Optional Ionicons name rendered before the label. */
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill-shaped tag. By default uses a 10% Primary tint background with dark
 * Primary text — matches the design system's "Vegan/Gluten-Free" chip spec.
 * Pass `iconName` to render a small icon before the label.
 */
export function Chip({
  label,
  variant = 'tint',
  tone = 'primary',
  selected = false,
  iconName,
  onPress,
  style,
}: ChipProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}_${tone}`],
    selected && styles[`selected_${tone}`],
    style,
  ];

  const labelColor: keyof Theme['colors'] =
    selected && variant !== 'solid'
      ? 'onPrimary'
      : variant === 'solid'
        ? tone === 'tertiary'
          ? 'onTertiary'
          : 'onPrimary'
        : tone === 'tertiary'
          ? 'tertiary'
          : tone === 'neutral'
            ? 'textSecondary'
            : 'primary';

  const content = (
    <View style={styles.row}>
      {iconName ? <Ionicons name={iconName} size={14} color={theme.colors[labelColor]} /> : null}
      <Text variant="labelLg" color={labelColor}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...containerStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{content}</View>;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.base,
      borderRadius: theme.radius.full,
      alignSelf: 'flex-start',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pressed: { opacity: 0.85 },

    // tint = 10% opacity background, dark text
    variant_tint_primary: { backgroundColor: theme.colors.primaryTint },
    variant_tint_tertiary: { backgroundColor: 'rgba(154, 69, 35, 0.10)' },
    variant_tint_neutral: { backgroundColor: theme.colors.surfaceVariant },

    // solid = full-color background, white text
    variant_solid_primary: { backgroundColor: theme.colors.primary },
    variant_solid_tertiary: { backgroundColor: theme.colors.tertiary },
    variant_solid_neutral: { backgroundColor: theme.colors.borderStrong },

    // outline = transparent w/ border
    variant_outline_primary: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: 'transparent',
    },
    variant_outline_tertiary: {
      borderWidth: 1.5,
      borderColor: theme.colors.tertiary,
      backgroundColor: 'transparent',
    },
    variant_outline_neutral: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },

    // selected = filled-in version of the corresponding tone
    selected_primary: { backgroundColor: theme.colors.primary },
    selected_tertiary: { backgroundColor: theme.colors.tertiary },
    selected_neutral: { backgroundColor: theme.colors.borderStrong },
  });
}
