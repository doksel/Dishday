import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Theme } from '../../theme';

export interface IconProps {
  /** Any Ionicons name. https://icons.expo.fyi */
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Pixel size. Default 22 (matches body line-height). */
  size?: number;
  /** Theme color token. Default `'text'`. */
  color?: keyof Theme['colors'];
}

/**
 * Themed wrapper around `@expo/vector-icons` Ionicons. Centralises icon
 * sizing and binds color to the theme palette so we never hardcode colors.
 *
 * Example:
 *   <Icon name="restaurant-outline" color="primary" size={24} />
 */
export function Icon({ name, size = 22, color = 'text' }: IconProps) {
  const theme = useTheme();
  return <Ionicons name={name} size={size} color={theme.colors[color]} />;
}
