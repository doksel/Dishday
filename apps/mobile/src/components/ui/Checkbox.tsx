import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../../theme';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  /** Cross out the label when checked (good for shopping list items). */
  strikeThrough?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Sage-coloured checkbox with optional strike-through label.
 * Tap-target sized for accessibility (≥44pt).
 */
export function Checkbox({
  checked,
  onChange,
  label,
  strikeThrough = false,
  disabled = false,
  style,
}: CheckboxProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.rowPressed, style]}
      hitSlop={8}
    >
      <View style={[styles.box, checked && styles.boxChecked, disabled && styles.disabled]}>
        {checked && <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />}
      </View>
      {label ? (
        <Text
          variant="bodyMd"
          color={checked ? 'textMuted' : 'text'}
          style={[styles.label, checked && strikeThrough && styles.struck]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, minHeight: 44 },
    rowPressed: { opacity: 0.85 },
    box: {
      width: 22,
      height: 22,
      borderRadius: theme.radius.sm,
      borderWidth: 1.5,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    disabled: { opacity: 0.5 },
    label: { flex: 1 },
    struck: { textDecorationLine: 'line-through' },
  });
}
