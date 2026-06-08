import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../../theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  /** Visual style. Default `'filled'` (cream-tinted background, no border in idle state). */
  variant?: 'filled' | 'underlined';
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Minimalist input — cream-tinted fill with a subtle focus ring, or
 * Notion-style underlined. Pairs with the design system's "quiet UI" philosophy.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helperText, error, variant = 'filled', containerStyle, style, onFocus, onBlur, ...rest },
  ref,
) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="labelLg" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          variant === 'filled' ? styles.fieldFilled : styles.fieldUnderlined,
          focused && (variant === 'filled' ? styles.filledFocus : styles.underlinedFocus),
          !!error && (variant === 'filled' ? styles.filledError : styles.underlinedError),
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, theme.typography.bodyLg, { color: theme.colors.text }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {(error || helperText) && (
        <Text variant="labelSm" color={error ? 'danger' : 'textMuted'} style={styles.helper}>
          {error ?? helperText}
        </Text>
      )}
    </View>
  );
});

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { gap: theme.spacing.base },
    label: { marginBottom: 2 },
    helper: { marginTop: 2 },
    input: {
      // body styles applied via spread of theme.typography.bodyLg
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    fieldFilled: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filledFocus: { borderColor: theme.colors.primary },
    filledError: { borderColor: theme.colors.danger },
    fieldUnderlined: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    underlinedFocus: { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
    underlinedError: { borderBottomColor: theme.colors.danger, borderBottomWidth: 2 },
  });
}
