import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SUPPORTED_LOCALES, type LocaleCode } from '@dishday/i18n';
import type { User } from '@dishday/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PaywallModal } from '../../src/components/PaywallModal';
import { Screen } from '../../src/components/Screen';
import { Button, Icon, Text } from '../../src/components/ui';
import { setLocale } from '../../src/i18n';
import { getApi } from '../../src/lib/api';
import { apiErrorMessage } from '../../src/lib/apiError';
import {
  AvatarCancelled,
  AvatarPermissionDenied,
  pickAndUploadAvatar,
} from '../../src/lib/avatar';
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
  const qc = useQueryClient();
  const { preference, setPreference } = useThemePreference();
  const { t, i18n } = useTranslation('profile');
  const tPaywall = useTranslation('paywall').t;
  const tCommon = useTranslation('common').t;
  const [paywallOpen, setPaywallOpen] = useState(false);

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });
  const isPro = me.data?.plan === 'pro' || me.data?.plan === 'admin';

  // ─── Editable identity state ──────────────────────────────────────
  // Name editing is inline: tap pencil → TextInput → Save commits, Cancel reverts.
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const saveName = useMutation({
    mutationFn: (name: string) => api.users.updateMe({ name }),
    onMutate: async (name) => {
      // Optimistic — flip the cached User immediately so the header updates
      // before the round-trip lands.
      await qc.cancelQueries({ queryKey: ['auth', 'me'] });
      const prev = qc.getQueryData<User>(['auth', 'me']);
      if (prev) qc.setQueryData<User>(['auth', 'me'], { ...prev, name });
      return { prev };
    },
    onError: (err, _name, ctx) => {
      if (ctx?.prev) qc.setQueryData(['auth', 'me'], ctx.prev);
      setNameError(apiErrorMessage(err, t));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  /**
   * Avatar upload — opens the OS picker, uploads to Supabase Storage, then
   * persists the resulting URL on the User row. We update local state first
   * with the new URL so the avatar swaps immediately without waiting on the
   * DB round-trip.
   */
  const uploadAvatar = useMutation({
    mutationFn: async () => {
      if (!me.data) throw new Error('User not loaded');
      const { publicUrl } = await pickAndUploadAvatar(me.data.id);
      return api.users.updateMe({ avatarUrl: publicUrl });
    },
    onSuccess: (user) => {
      qc.setQueryData(['auth', 'me'], user);
      setAvatarError(null);
    },
    onError: (err) => {
      if (err instanceof AvatarCancelled) return; // silent — user closed the picker
      if (err instanceof AvatarPermissionDenied) {
        setAvatarError(t('edit.avatar.errors.permission'));
        return;
      }
      setAvatarError(t('edit.avatar.errors.upload', { error: apiErrorMessage(err, t) }));
    },
  });

  function startEditingName() {
    setDraftName(me.data?.name ?? '');
    setNameError(null);
    setEditingName(true);
  }

  function commitName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === me.data?.name) {
      setEditingName(false);
      return;
    }
    saveName.mutate(trimmed, {
      onSuccess: () => setEditingName(false),
    });
  }

  function cancelEditingName() {
    setEditingName(false);
    setNameError(null);
  }

  /**
   * Open Stripe Billing Portal in the system browser. Pro users only —
   * Free users hit the upgrade flow instead.
   */
  const openPortal = useMutation({
    mutationFn: () => api.subscriptions.createPortal({}),
    onSuccess: async ({ url }) => {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    },
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
            {/* Avatar — tap to change */}
            <Pressable
              onPress={() => uploadAvatar.mutate()}
              disabled={uploadAvatar.isPending}
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.avatarWrapPressed]}
              hitSlop={4}
            >
              {me.data.avatarUrl ? (
                <Image source={{ uri: me.data.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarFallback]}>
                  <Text variant="headlineLg" color="onPrimary">
                    {(me.data.name ?? '?').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                {uploadAvatar.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Icon name="camera" color="onPrimary" size={14} />
                )}
              </View>
            </Pressable>

            {/* Name — tap pencil to edit inline */}
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  maxLength={100}
                  style={styles.nameInput}
                  placeholder={t('edit.namePlaceholder')}
                  onSubmitEditing={commitName}
                  returnKeyType="done"
                />
                <Pressable onPress={cancelEditingName} hitSlop={8} style={styles.iconBtn}>
                  <Icon name="close" color="textSecondary" size={20} />
                </Pressable>
                <Pressable
                  onPress={commitName}
                  hitSlop={8}
                  style={styles.iconBtn}
                  disabled={saveName.isPending}
                >
                  {saveName.isPending ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Icon name="checkmark" color="primary" size={22} />
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={startEditingName}
                hitSlop={6}
                style={({ pressed }) => [styles.nameRow, pressed && styles.nameRowPressed]}
              >
                <Text variant="headlineMd">{me.data.name}</Text>
                <Icon name="pencil" color="textMuted" size={16} />
              </Pressable>
            )}

            <Text variant="bodyMd" color="textSecondary">
              {me.data.email}
            </Text>
            <View style={styles.planBadge}>
              <Text variant="labelSm" color={me.data.plan === 'pro' ? 'tertiary' : 'primary'}>
                {t(`common:plan.${me.data.plan}`)}
              </Text>
            </View>

            {avatarError && (
              <Text variant="labelSm" color="danger">{avatarError}</Text>
            )}
            {nameError && (
              <Text variant="labelSm" color="danger">{nameError}</Text>
            )}
          </View>
        )}

        {me.isError && (
          <Text variant="bodyMd" color="danger">
            {t('errors.loadFailed')}
          </Text>
        )}
      </View>

      {/* Subscription */}
      {me.data && (
        <View style={styles.section}>
          <Text variant="labelLg" color="textSecondary">
            {tPaywall('section.title')}
          </Text>
          {isPro ? (
            <Pressable
              onPress={() => openPortal.mutate()}
              disabled={openPortal.isPending}
              style={({ pressed }) => [
                styles.subRow,
                pressed && styles.subRowPressed,
                openPortal.isPending && styles.subRowDisabled,
              ]}
            >
              <View style={styles.subRowIcon}>
                <Icon name="card-outline" color="primary" size={22} />
              </View>
              <View style={styles.subRowText}>
                <Text variant="bodyLg">
                  {openPortal.isPending ? tPaywall('cta.opening') : tPaywall('cta.manage')}
                </Text>
                <Text variant="labelSm" color="textSecondary">
                  {tPaywall('section.manageBody')}
                </Text>
              </View>
              <Icon name="chevron-forward" color="textMuted" size={20} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setPaywallOpen(true)}
              style={({ pressed }) => [styles.subRow, pressed && styles.subRowPressed]}
            >
              <View style={styles.subRowIcon}>
                <Icon name="sparkles" color="primary" size={22} />
              </View>
              <View style={styles.subRowText}>
                <Text variant="bodyLg">{tPaywall('cta.upgrade')}</Text>
                <Text variant="labelSm" color="textSecondary">
                  {tPaywall('section.currentFree')}
                </Text>
              </View>
              <Icon name="chevron-forward" color="textMuted" size={20} />
            </Pressable>
          )}
          {openPortal.error && (
            <Text variant="bodyMd" color="danger">
              {tPaywall('errors.portalFailed', { error: apiErrorMessage(openPortal.error, tPaywall) })}
            </Text>
          )}
        </View>
      )}

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

      <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    identity: { marginTop: theme.spacing.sm, gap: theme.spacing.base, alignItems: 'flex-start' },

    // Avatar
    avatarWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      marginBottom: theme.spacing.xs,
    },
    avatarWrapPressed: { opacity: 0.85 },
    avatarImg: { width: 80, height: 80, borderRadius: 40 },
    avatarFallback: {
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Name edit
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    nameRowPressed: { opacity: 0.7 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    nameInput: {
      ...theme.typography.headlineMd,
      color: theme.colors.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary,
      paddingVertical: 2,
      minWidth: 180,
    },
    iconBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },

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

    // Subscription row
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subRowPressed: { opacity: 0.85 },
    subRowDisabled: { opacity: 0.6 },
    subRowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subRowText: { flex: 1, gap: 2 },
  });
}
