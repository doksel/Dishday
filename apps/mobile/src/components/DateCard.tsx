import { Pressable, StyleSheet } from 'react-native';
import { Text } from './ui';
import { useThemedStyles, type Theme } from '../theme';

export interface DateCardProps {
  /** Short weekday label, e.g. "Mon". */
  dayName: string;
  /** Day of month, e.g. 12. */
  dayOfMonth: number;
  active?: boolean;
  onPress?: () => void;
}

/**
 * Single tile in the horizontal week date scroller. Active state shows
 * solid Sage with white text, inactive uses outlined white card.
 */
export function DateCard({ dayName, dayOfMonth, active = false, onPress }: DateCardProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        active ? styles.active : styles.inactive,
        pressed && !active && styles.pressed,
      ]}
    >
      <Text
        variant="labelSm"
        color={active ? 'onPrimary' : 'textSecondary'}
        style={styles.day}
      >
        {dayName.toUpperCase()}
      </Text>
      <Text variant="headlineMd" color={active ? 'onPrimary' : 'text'}>
        {dayOfMonth}
      </Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      width: 56,
      height: 80,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.base,
    },
    active: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    inactive: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pressed: { opacity: 0.7 },
    day: { letterSpacing: 1 },
  });
}
