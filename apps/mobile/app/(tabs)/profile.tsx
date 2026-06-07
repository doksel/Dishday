import { useQuery } from '@tanstack/react-query';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { getApi } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabase';
import { useTheme, useThemePreference, type ThemePreference } from '../../src/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const api = getApi();
  const { preference, setPreference } = useThemePreference();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.text }}>Profile</Text>
          {me.data && (
            <>
              <Text style={{ marginTop: 4, color: theme.colors.text, fontSize: 16 }}>
                {me.data.name}
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>{me.data.email}</Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: theme.spacing.sm,
                  backgroundColor: theme.colors.surfaceVariant,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 2,
                  borderRadius: theme.radius.full,
                }}
              >
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  {me.data.plan.toUpperCase()}
                </Text>
              </View>
            </>
          )}
          {me.isError && (
            <Text style={{ marginTop: 4, color: theme.colors.danger, fontSize: 12 }}>
              Could not load profile
            </Text>
          )}
        </View>

        {/* Theme picker */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Appearance</Text>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: theme.radius.md,
              padding: 4,
              gap: 4,
            }}
          >
            {OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: theme.radius.sm,
                    backgroundColor: active ? theme.colors.surface : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: active ? theme.colors.text : theme.colors.textSecondary,
                      fontWeight: active ? '600' : '500',
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={{
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text style={{ color: theme.colors.danger, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
