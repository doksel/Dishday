/**
 * Paywall modal — shown when a Free user tries a Pro-gated action.
 *
 *   Layout: hero lock icon, title + subtitle, 3 feature rows with check
 *   icons, big "Upgrade $9.99/mo" CTA, secondary "Maybe later" link.
 *
 *   Tapping "Upgrade" → POST /subscriptions/checkout → opens the returned
 *   Stripe URL in the system browser (Safari / Chrome). The user pays
 *   there and manually returns to the app; the AppState 'active' handler
 *   in _layout.tsx will refetch /auth/me and the Pro plan flips on.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import type { SubscriptionPlan } from '@dishday/api-client';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Text } from './ui';
import { getApi } from '../lib/api';
import { apiErrorMessage } from '../lib/apiError';
import { useTheme, useThemedStyles, type Theme } from '../theme';

/**
 * Context-specific framing for the paywall.
 *
 *   - `history`      — Free user tried to navigate to a past week
 *   - `bookmarks`    — Free user hit the bookmark cap (10)
 *   - `quickDishes`  — Free user hit the quick-dish cap (10)
 *   - `aiGenerate`   — Free user tapped AI generate (default fallback)
 *   - undefined      — generic "Unlock Pro" framing
 *
 * The visible difference is just a single subtitle string above the
 * features list — same Stripe checkout flow underneath.
 */
export type PaywallContext = 'history' | 'bookmarks' | 'quickDishes' | 'aiGenerate';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional override for where Stripe redirects after success. */
  returnUrl?: string;
  /** Render context-specific framing (subtitle + maybe future CTAs). */
  context?: PaywallContext;
}

export function PaywallModal({ visible, onClose, returnUrl, context }: PaywallModalProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('paywall');
  const api = getApi();

  const plansQ = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.subscriptions.getPlans(),
    enabled: visible,
    staleTime: 1000 * 60 * 60, // plans rarely change — cache an hour
  });

  const proPlan = plansQ.data?.find((p): p is SubscriptionPlan => p.id === 'pro');

  const checkout = useMutation({
    mutationFn: () =>
      api.subscriptions.createCheckout({
        priceId: proPlan?.stripePriceId ?? undefined,
        returnUrl,
      }),
    onSuccess: async ({ url }) => {
      // Linking.openURL throws if no app can handle the URL — guard with canOpen.
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      onClose();
    },
  });

  const features = [
    t('features.aiPlan'),
    t('features.pantry'),
    t('features.support'),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top bar — close button */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Icon name="close" size={26} color="text" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.heroIconWrap}>
            <Icon name="sparkles" size={36} color="onPrimary" />
          </View>

          <Text variant="headlineLg" align="center" style={styles.title}>
            {t('title')}
          </Text>
          <Text variant="bodyLg" color="textSecondary" align="center" style={styles.subtitle}>
            {context ? t(`context.${context}`) : t('subtitle')}
          </Text>

          <View style={styles.featureList}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Icon name="checkmark" size={16} color="onPrimary" />
                </View>
                <Text variant="bodyLg" style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {plansQ.isLoading && (
            <ActivityIndicator color={theme.colors.primary} style={styles.priceLoader} />
          )}

          {proPlan && (
            <View style={styles.priceWrap}>
              <Text variant="displayLg" color="primary">
                {t('price.monthly', { amount: proPlan.priceMonthlyUsd.toFixed(2) })}
              </Text>
            </View>
          )}

          {checkout.error && (
            <Text variant="bodyMd" color="danger" align="center" style={styles.errorText}>
              {t('errors.checkoutFailed', { error: apiErrorMessage(checkout.error, t) })}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            label={checkout.isPending ? t('cta.upgrading') : t('cta.upgrade')}
            variant="primary"
            size="lg"
            fullWidth
            loading={checkout.isPending}
            disabled={checkout.isPending || !proPlan}
            onPress={() => checkout.mutate()}
          />
          <Pressable onPress={onClose} hitSlop={8} style={styles.laterBtn}>
            <Text variant="bodyMd" color="textSecondary">{t('cta.later')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    body: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      alignItems: 'center',
    },
    heroIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    title: { marginBottom: theme.spacing.sm },
    subtitle: { marginBottom: theme.spacing.xl, maxWidth: 320 },
    featureList: {
      width: '100%',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    featureCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: { flex: 1 },
    priceLoader: { marginTop: theme.spacing.md },
    priceWrap: { marginTop: theme.spacing.md },
    errorText: { marginTop: theme.spacing.md },
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    laterBtn: { padding: theme.spacing.sm },
  });
}
