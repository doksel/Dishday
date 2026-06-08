import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Card, Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabase';
import {
  useThemePreference,
  useThemedStyles,
  type Theme,
  type ThemePreference,
} from '../../src/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const api = getApi();
  const { preference, setPreference } = useThemePreference();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });

  return (
    <Screen gap="lg">
      <View>
        <Text variant="displayLg">Profile</Text>
        {me.data && (
          <View style={styles.identity}>
            <Text variant="headlineMd">{me.data.name}</Text>
            <Text variant="bodyMd" color="textSecondary">
              {me.data.email}
            </Text>
            <View style={styles.planBadge}>
              <Text variant="labelSm" color={me.data.plan === 'pro' ? 'tertiary' : 'primary'}>
                {me.data.plan.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
        {me.isError && (
          <Text variant="bodyMd" color="danger">
            Could not load profile
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelLg" color="textSecondary">
          APPEARANCE
        </Text>
        <View style={styles.segmented}>
          {OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPreference(opt.value)}
                style={({ pressed }) => [
                  styles.segment,
                  active && styles.segmentActive,
                  pressed && !active && styles.segmentPressed,
                ]}
              >
                <Text
                  variant="labelLg"
                  color={active ? 'text' : 'textSecondary'}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label="Sign out"
        variant="secondary"
        fullWidth
        onPress={() => supabase.auth.signOut()}
      />
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    identity: { marginTop: theme.spacing.sm, gap: theme.spacing.base },
    planBadge: {
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surfaceVariant,
    },
    section: { gap: theme.spacing.sm },
    segmented: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.radius.full,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    segmentActive: {
      backgroundColor: theme.colors.surface,
      // soft shadow per design system Level 1
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.24 : 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentPressed: { opacity: 0.7 },
  });
}
