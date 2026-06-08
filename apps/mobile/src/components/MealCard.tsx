import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { MealType } from '@dishday/types';
import { Icon, Text } from './ui';
import { useThemedStyles, type Theme } from '../theme';

export interface MealCardProps {
  imageUrl?: string | null;
  mealType: MealType;
  title: string;
  /** Tap on the right "+" action button — usually adds the meal somewhere. */
  onActionPress?: () => void;
  /** Tap anywhere else on the card — usually opens recipe detail. */
  onPress?: () => void;
}

/**
 * Recipe row card: square image on the left, meal-type label + dish title
 * in the centre, primary-tinted "+" action button on the right.
 */
export function MealCard({ imageUrl, mealType, title, onActionPress, onPress }: MealCardProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Icon name="restaurant-outline" color="textMuted" size={28} />
        </View>
      )}
      <View style={styles.body}>
        <Text variant="labelSm" color="primary" style={styles.mealType}>
          {mealType.toUpperCase()}
        </Text>
        <Text variant="bodyLg" style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Pressable
        onPress={onActionPress}
        hitSlop={8}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Icon name="add" color="primary" size={20} />
      </Pressable>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      // Soft ambient shadow (Level 1 per design spec)
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.18 : 0.04,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardPressed: { opacity: 0.94 },
    image: { width: 96, height: 96 },
    imageFallback: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      justifyContent: 'center',
    },
    mealType: { letterSpacing: 0.5 },
    title: { fontWeight: '700', marginTop: 2 },
    action: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginRight: theme.spacing.sm,
    },
    actionPressed: { backgroundColor: theme.colors.surfaceContainerHigh },
  });
}
