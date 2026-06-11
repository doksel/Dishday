import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from './ui';
import { useThemedStyles, type Theme } from '../theme';

export interface AppHeaderProps {
  /** Bold sage brand title, e.g. "Dishday". */
  brand?: string;
  /** Display name shown next to the time-aware greeting. */
  userName?: string;
  /** Avatar image URL. Falls back to a tinted circle with first letter. */
  avatarUrl?: string | null;
  /** Bell tap — open notifications screen. */
  onNotificationsPress?: () => void;
  /** Avatar tap — open profile. */
  onAvatarPress?: () => void;
}

/**
 * Top app bar — avatar + brand/greeting + notifications bell.
 * Greeting follows the local time of day, localized via i18n.
 */
export function AppHeader({
  brand = 'Dishday',
  userName,
  avatarUrl,
  onNotificationsPress,
  onAvatarPress,
}: AppHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('home');

  const greeting = t(`greeting.${timeKey()}`);
  const initial = userName?.trim().charAt(0).toUpperCase();
  const firstName = userName?.split(' ')[0];

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Pressable onPress={onAvatarPress} hitSlop={4}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text variant="labelLg" color="textSecondary">
                {initial ?? '?'}
              </Text>
            )}
          </View>
        </Pressable>
        <View>
          <Text variant="headlineMd" color="primary">
            {brand}
          </Text>
          <Text variant="labelSm" color="textSecondary">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </Text>
        </View>
      </View>
      <Pressable onPress={onNotificationsPress} hitSlop={8} style={styles.bell}>
        <Icon name="notifications-outline" color="text" size={24} />
      </Pressable>
    </View>
  );
}

type GreetingKey = 'morning' | 'afternoon' | 'evening' | 'night';
function timeKey(): GreetingKey {
  const h = new Date().getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    bell: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
  });
}
