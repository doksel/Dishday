import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@dishday/api-client';
import type { DayOfWeek, MealPlan, MealType, Recipe, ShoppingList, User } from '@dishday/types';
import { pickLocalized, planWeekDates, weekStartIso } from '@dishday/utils';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { PaywallModal } from '../../src/components/PaywallModal';
import { RecipePickerModal } from '../../src/components/RecipePickerModal';
import { Screen } from '../../src/components/Screen';
import { getApi } from '../../src/lib/api';
import { apiErrorMessage } from '../../src/lib/apiError';
import { useThemedStyles, useTheme, type Theme } from '../../src/theme';
import { Icon, Text } from '../../src/components/ui';

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface PickerTarget {
  planId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
}

export default function PlannerScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { t, i18n } = useTranslation('planner');
  const tMealTypes = useTranslation('mealTypes').t;
  const tCommon = useTranslation('common').t;
  const tShop = useTranslation('shoppingList').t;
  const api = getApi();
  const qc = useQueryClient();
  const week = weekStartIso();
  const weekDates = planWeekDates(week);

  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const me = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });
  const isPro = me.data?.plan === 'pro' || me.data?.plan === 'admin';

  const plans = useQuery<MealPlan[]>({
    queryKey: ['meal-plans'],
    queryFn: () => api.mealPlans.list(),
  });

  const currentPlan = plans.data?.find((p) => p.weekStart === week);

  /**
   * Lightweight item-count query. Only enabled once we know the plan and
   * its entries are non-empty — otherwise the server would auto-generate
   * an empty list on `GET` and that's wasted work. We don't render the
   * full list here; the button just shows the badge.
   *
   * Additional tier gate: when the current plan was AI-generated for a Free
   * user, its recipes are `previewOnly` (no ingredients) so there's nothing
   * to consolidate into a shopping list. We skip the fetch and lock the
   * button — tap opens the paywall instead.
   */
  const planHasEntries = !!currentPlan && (currentPlan.entries?.length ?? 0) > 0;
  const planIsPreviewOnly =
    !!currentPlan && (currentPlan.entries?.some((e) => e.recipe?.previewOnly) ?? false);
  const shoppingLocked = planIsPreviewOnly && !isPro;
  const shoppingQ = useQuery<ShoppingList>({
    queryKey: ['shopping-list', currentPlan?.id],
    queryFn: () => api.shoppingLists.forPlan(currentPlan!.id),
    enabled: planHasEntries && !shoppingLocked,
  });
  const shoppingItemCount = shoppingQ.data?.items?.length ?? 0;

  const create = useMutation({
    mutationFn: () => api.mealPlans.create({ weekStart: week }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  const aiGenerate = useMutation({
    mutationFn: () => api.mealPlans.aiGenerate({ weekStart: week }),
    onSuccess: (data) => setPendingJobId(data.jobId),
    /**
     * Backend returns 402 PLAN_REQUIRED for Free users — even if the client
     * gate below somehow misses (stale `me`, race, etc.). Convert that into
     * a paywall instead of a generic error banner.
     */
    onError: (err) => {
      if (err instanceof ApiClientError && err.status === 402) {
        setPaywallOpen(true);
      }
    },
  });

  /**
   * Tap handler for the AI-generate buttons. Free users get the paywall
   * immediately (no wasted network round-trip); Pro/admin go straight to
   * the worker.
   */
  function handleAiGenerate() {
    if (!isPro) {
      setPaywallOpen(true);
      return;
    }
    aiGenerate.mutate();
  }

  const addEntry = useMutation({
    mutationFn: ({ planId, recipeId, dayOfWeek, mealType }: {
      planId: string; recipeId: string; dayOfWeek: DayOfWeek; mealType: MealType;
    }) => api.mealPlans.addEntry(planId, { recipeId, dayOfWeek, mealType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  const removeEntry = useMutation({
    mutationFn: ({ planId, entryId }: { planId: string; entryId: string }) =>
      api.mealPlans.removeEntry(planId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  const aiJob = useQuery({
    queryKey: ['ai-job', pendingJobId],
    queryFn: () => api.mealPlans.aiJob(pendingJobId!),
    enabled: !!pendingJobId,
    refetchInterval: (q) => {
      const state = q.state.data?.state;
      return state === 'completed' || state === 'failed' ? false : 2000;
    },
  });

  useEffect(() => {
    if (!aiJob.data) return;
    if (aiJob.data.state === 'completed') {
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
      setPendingJobId(null);
    } else if (aiJob.data.state === 'failed') {
      setPendingJobId(null);
    }
  }, [aiJob.data, qc]);

  const aiPending =
    aiGenerate.isPending ||
    (pendingJobId !== null && aiJob.data?.state !== 'completed' && aiJob.data?.state !== 'failed');

  /**
   * Empty slot tap → open the picker.
   * Occupied slot tap → 3-way action sheet: Replace (re-opens picker; backend
   * is now idempotent and will overwrite the existing entry in the slot),
   * Remove (deletes), Cancel.
   *
   * "Replace" is the more common intent — the old single-action "Remove" was
   * confusing because you couldn't change a dish without first emptying the
   * slot. The DB-level unique constraint guarantees we can't end up with two
   * dishes in the same slot no matter which path the user takes.
   */
  function handleSlotPress(dayOfWeek: DayOfWeek, mealType: MealType, occupiedEntryId?: string) {
    if (!currentPlan) return;
    if (occupiedEntryId) {
      Alert.alert(t('slotActions.title'), t('slotActions.body'), [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('slotActions.remove'),
          style: 'destructive',
          onPress: () => removeEntry.mutate({ planId: currentPlan.id, entryId: occupiedEntryId }),
        },
        {
          text: t('slotActions.replace'),
          onPress: () => setPicker({ planId: currentPlan.id, dayOfWeek, mealType }),
        },
      ]);
      return;
    }
    setPicker({ planId: currentPlan.id, dayOfWeek, mealType });
  }

  function handlePickRecipe(recipe: Recipe) {
    if (!picker) return;
    addEntry.mutate({
      planId: picker.planId,
      recipeId: recipe.id,
      dayOfWeek: picker.dayOfWeek,
      mealType: picker.mealType,
    });
    setPicker(null);
  }

  return (
    <Screen variant="scroll" gap="md">
      <Text variant="displayLg">{t('title', { week })}</Text>

      {plans.isLoading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {plans.error && (
        <Text variant="bodyMd" color="danger">
          {t('loadError', { error: apiErrorMessage(plans.error, t) })}
        </Text>
      )}

      {aiPending && (
        <View style={styles.banner}>
          <ActivityIndicator color={theme.colors.onPrimary} />
          <Text variant="bodyMd" color="onPrimary" style={styles.bannerText}>
            {t('generating')}
          </Text>
        </View>
      )}

      {aiJob.data?.state === 'failed' && aiJob.data.failedReason && (
        <Text variant="bodyMd" color="danger">
          {t('aiFailed', { reason: aiJob.data.failedReason })}
        </Text>
      )}

      {!plans.isLoading && !currentPlan && !aiPending && (
        <View style={styles.card}>
          <Text variant="headlineMd">{t('emptyTitle')}</Text>
          <Text variant="bodyMd" color="textSecondary">{t('emptyBody')}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => create.mutate()}
              disabled={create.isPending}
              style={[styles.btnPrimary, create.isPending && styles.disabled]}
            >
              <Text variant="bodyLg" color="onPrimary">
                {create.isPending ? t('creating') : t('emptyPlan')}
              </Text>
            </Pressable>
            <Pressable onPress={handleAiGenerate} style={styles.btnSecondary}>
              {!isPro && <Icon name="lock-closed" size={14} color="textSecondary" />}
              <Text variant="bodyLg">{t('aiGenerate')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {currentPlan &&
        weekDates.map((date, dayIdx) => {
          const dayLabel = date.toLocaleDateString(i18n.language, { weekday: 'short' });
          return (
            <View key={dayIdx} style={styles.card}>
              <Text variant="labelLg">{dayLabel.toUpperCase()}</Text>
              {SLOTS.map((slot) => {
                const entry = currentPlan.entries?.find(
                  (e) => e.dayOfWeek === dayIdx && e.mealType === slot,
                );
                return (
                  <Pressable
                    key={slot}
                    onPress={() => handleSlotPress(dayIdx as DayOfWeek, slot, entry?.id)}
                    style={({ pressed }) => [
                      styles.slotRow,
                      slot !== 'snack' && styles.slotRowDivider,
                      pressed && styles.slotPressed,
                    ]}
                  >
                    <Text variant="labelSm" color="textMuted" style={styles.slotName}>
                      {tMealTypes(slot)}
                    </Text>
                    <Text
                      variant="bodyMd"
                      color={entry ? 'text' : 'textMuted'}
                      style={styles.slotEntry}
                      numberOfLines={1}
                    >
                      {entry?.recipe
                        ? pickLocalized(entry.recipe.title, entry.recipe.titleI18n, i18n.language)
                        : t('tapToAdd')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

      {currentPlan && planHasEntries && (
        <Pressable
          onPress={() =>
            shoppingLocked
              ? setPaywallOpen(true)
              : router.push(`/shopping-list/${currentPlan.id}`)
          }
          style={({ pressed }) => [styles.shopBtn, pressed && styles.shopBtnPressed]}
        >
          <View style={styles.shopBtnIcon}>
            <Icon
              name={shoppingLocked ? 'lock-closed' : 'cart-outline'}
              color="onPrimary"
              size={22}
            />
          </View>
          <Text variant="bodyLg" color="onPrimary" style={styles.shopBtnLabel}>
            {shoppingItemCount > 0
              ? tShop('openButton', { count: shoppingItemCount })
              : tShop('openButton')}
          </Text>
          <Icon name="chevron-forward" color="onPrimary" size={20} />
        </Pressable>
      )}

      <RecipePickerModal
        visible={picker !== null}
        mealType={picker?.mealType}
        onClose={() => setPicker(null)}
        onSelect={handlePickRecipe}
      />

      <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    bannerText: { fontWeight: '600' },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    row: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    btnPrimary: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: theme.radius.full,
      alignItems: 'center',
    },
    btnSecondary: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.6 },
    slotRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: theme.radius.sm,
    },
    slotRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    slotPressed: { backgroundColor: theme.colors.surfaceVariant },
    slotName: { width: 90, textTransform: 'capitalize' },
    slotEntry: { flex: 1 },
    shopBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      marginTop: theme.spacing.sm,
    },
    shopBtnPressed: { opacity: 0.92 },
    shopBtnIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    shopBtnLabel: { flex: 1, fontWeight: '600' },
  });
}
