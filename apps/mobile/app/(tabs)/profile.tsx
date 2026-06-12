import { useQuery } from '@tanstack/react-query';
import { SUPPORTED_LOCALES, type LocaleCode } from '@dishday/i18n';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Text } from '../../src/components/ui';
import { setLocale } from '../../src/i18n';
import { getApi } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabase';
import {
  useThemePreference,
  useThemedStyles,
  type Theme,
  type ThemePreference,
} from '../../src/theme';

export default function ProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const api = getApi();
  const { preference, setPreference } = useThemePreference();
  const { t, i18n } = useTranslation('profile');

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('theme.system') },
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
  ];

  /**
   * Switch UI language locally AND persist it to the user's account, so other
   * devices (web, second phone) pick the same preference and AI prompts use
   * the right language. We don't `await` the API call — if it fails (offline,
   * unauthenticated, server hiccup) the UI change still sticks via i18n
   * storage; the next successful settings save will re-sync.
   */
  const handleLocaleChange = (code: LocaleCode) => {
    void setLocale(code);
    api.users.setLocale(code).catch(() => {
      // best-effort sync — local AsyncStorage is the source of truth here
    });
  };

  return (
    <Screen gap="lg">
      <View>
        <Text variant="displayLg">{t('title')}</Text>
        {me.data && (
          <View style={styles.identity}>
            <Text variant="headlineMd">{me.data.name}</Text>
            <Text variant="bodyMd" color="textSecondary">
              {me.data.email}
            </Text>
            <View style={styles.planBadge}>
              <Text variant="labelSm" color={me.data.plan === 'pro' ? 'tertiary' : 'primary'}>
                {t(`common:plan.${me.data.plan}`)}
              </Text>
            </View>
          </View>
        )}
        {me.isError && (
          <Text variant="bodyMd" color="danger">
            {t('errors.loadFailed')}
          </Text>
        )}
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text variant="labelLg" color="textSecondary">
          {t('appearance')}
        </Text>
        <View style={styles.segmented}>
          {themeOptions.map((opt) => {
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
                <Text variant="labelLg" color={active ? 'text' : 'textSecondary'}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text variant="labelLg" color="textSecondary">
          {t('language')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.languagesRow}
        >
          {SUPPORTED_LOCALES.map((loc) => {
            const active = i18n.language === loc.code;
            return (
              <Pressable
                key={loc.code}
                onPress={() => handleLocaleChange(loc.code as LocaleCode)}
                style={({ pressed }) => [
                  styles.langTile,
                  active && styles.langTileActive,
                  pressed && !active && styles.langTilePressed,
                ]}
              >
                <Text variant="headlineMd">{loc.flag}</Text>
                <Text
                  variant="labelLg"
                  color={active ? 'primary' : 'text'}
                  style={styles.langName}
                >
                  {loc.nativeName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Button
        label={t('common:signOut')}
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

    // Theme segmented
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
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.24 : 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentPressed: { opacity: 0.7 },

    // Language tiles
    languagesRow: { gap: theme.spacing.sm, paddingVertical: 4 },
    langTile: {
      minWidth: 80,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: 4,
    },
    langTileActive: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      backgroundColor: theme.colors.primaryTint,
    },
    langTilePressed: { opacity: 0.7 },
    langName: {},
  });
}
