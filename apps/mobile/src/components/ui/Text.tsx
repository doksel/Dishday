import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme, type Theme } from '../../theme';

export type TextVariant = keyof Theme['typography'];

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Color token from theme.colors. Falls back to text. */
  color?: keyof Theme['colors'];
  /** Quick alignment shortcut. */
  align?: TextStyle['textAlign'];
}

/**
 * Themed Text. Picks font family / size / weight / line-height from the
 * typography scale (Plus Jakarta Sans for headings, Work Sans for body).
 *
 * Examples:
 *   <Text variant="displayLg">Today</Text>
 *   <Text variant="bodyMd" color="textSecondary">Subtitle</Text>
 *   <Text variant="labelSm" color="textMuted" align="center">CAPTION</Text>
 */
export function Text({
  variant = 'bodyMd',
  color = 'text',
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[theme.typography[variant], { color: theme.colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
