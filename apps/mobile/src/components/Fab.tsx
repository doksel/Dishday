import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, type Theme } from '../theme';

export interface FabProps {
  /** Any Ionicons name. https://icons.expo.fyi */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  /** Bottom offset (absolute positioning). Default 24. */
  bottom?: number;
  /** Right offset. Default 16. */
  right?: number;
}

/**
 * Floating Action Button — circular Sage button pinned to the bottom-right.
 * Positioned absolutely; place it as a sibling of the screen's content so
 * it stays put while the content scrolls.
 */
export function Fab({ icon, onPress, bottom = 24, right = 16 }: FabProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom, right }, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={26} color={theme.colors.onPrimary} />
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    pressed: { opacity: 0.9 },
  });
}
