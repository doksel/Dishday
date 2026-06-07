import { useQuery } from '@tanstack/react-query';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Profile</Text>
          {me.data && (
            <>
              <Text style={styles.name}>{me.data.name}</Text>
              <Text style={styles.email}>{me.data.email}</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{me.data.plan.toUpperCase()}</Text>
              </View>
            </>
          )}
          {me.isError && <Text style={styles.error}>Could not load profile</Text>}
        </View>

        {/* Theme picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.segmented}>
            {OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <Text style={active ? styles.segmentTextActive : styles.segmentText}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sign out */}
        <Pressable onPress={() => supabase.auth.signOut()} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.xl, gap: theme.spacing.lg },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    name: { marginTop: 4, color: theme.colors.text, fontSize: 16 },
    email: { color: theme.colors.textSecondary },
    planBadge: {
      alignSelf: 'flex-start',
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.full,
    },
    planBadgeText: { fontSize: 12, color: theme.colors.textSecondary },
    error: { marginTop: 4, color: theme.colors.danger, fontSize: 12 },
    section: { gap: theme.spacing.sm },
    sectionLabel: { fontSize: 13, color: theme.colors.textSecondary },
    segmented: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.radius.md,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radius.sm,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: theme.colors.surface },
    segmentText: { color: theme.colors.textSecondary, fontWeight: '500' },
    segmentTextActive: { color: theme.colors.text, fontWeight: '600' },
    signOutBtn: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    signOutText: { color: theme.colors.danger, fontWeight: '600' },
  });
}
