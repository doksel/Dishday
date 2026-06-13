import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickLocalized, planWeekDates, weekStartIso } from '@dishday/utils';
import type { MealPlan, MealPlanEntry, MealType, Recipe } from '@dishday/types';
import { RecipePickerModal } from '../src/components/RecipePickerModal';
import { Button, Chip, Icon, Text } from '../src/components/ui';
import { getApi } from '../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../src/theme';

/** Per-meal kcal targets used for the calorie-progress bar. */
const KCAL_TARGET: Record<MealType, number> = {
  breakfast: 500,
  lunch: 700,
  dinner: 700,
  snack: 200,
};

const FAT_TARGET: Record<MealType, number> = {
  breakfast: 20,
  lunch: 25,
  dinner: 25,
  snack: 10,
};

export default function MealSlotScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const api = getApi();
  const { t, i18n } = useTranslation('meal');
  const tMealTypes = useTranslation('mealTypes').t;

  const params = useLocalSearchParams<{ planId: string; dow: string; mealType: MealType }>();
  const planId = params.planId;
  const dow = Number(params.dow ?? '0') as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const mealType = (params.mealType ?? 'breakfast') as MealType;

  const [pickerOpen, setPickerOpen] = useState(false);

  const plan = useQuery<MealPlan>({
    queryKey: ['meal-plan', planId],
    queryFn: () => api.mealPlans.get(planId),
    enabled: !!planId,
  });

  const bookmarks = useQuery({
    queryKey: ['recipes', 'bookmarks'],
    queryFn: () => api.recipes.listBookmarks(),
  });
  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.data?.map((r) => r.id) ?? []),
    [bookmarks.data],
  );

  /**
   * All dishes in this slot. A single meal (e.g. lunch) can have multiple
   * dishes — soup + main + side — and the user can add/remove individually.
   * Migration 20260613140000_drop_meal_plan_slot_unique allows the multiple
   * rows; the previous one-per-slot constraint was the wrong fit for real
   * meal composition.
   */
  const entries = useMemo(
    () => plan.data?.entries?.filter((e) => e.dayOfWeek === dow && e.mealType === mealType) ?? [],
    [plan.data, dow, mealType],
  );

  /** Sum macros across every dish in the slot (with serving multiplier). */
  const macros = useMemo(() => {
    let kcal = 0,
      proteinG = 0,
      carbsG = 0,
      fatG = 0;
    for (const e of entries) {
      if (!e.recipe) continue;
      const f = e.servings;
      kcal += (e.recipe.caloriesPerServing ?? 0) * f;
      proteinG += (e.recipe.proteinG ?? 0) * f;
      carbsG += (e.recipe.carbsG ?? 0) * f;
      fatG += (e.recipe.fatG ?? 0) * f;
    }
    return { kcal, proteinG, carbsG, fatG };
  }, [entries]);

  const kcalTarget = KCAL_TARGET[mealType];
  const fatTarget = FAT_TARGET[mealType];
  const kcalPct = clamp01(macros.kcal / kcalTarget);
  const fatPct = clamp01(macros.fatG / fatTarget);

  const addEntry = useMutation({
    mutationFn: (recipeId: string) =>
      api.mealPlans.addEntry(planId, { recipeId, dayOfWeek: dow, mealType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan', planId] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });

  /** Remove a single dish from the slot — keeps other dishes intact. */
  const removeEntry = useMutation({
    mutationFn: (entryId: string) => api.mealPlans.removeEntry(planId, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan', planId] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });

  function handleRemoveDish(entryId: string, dishName: string) {
    Alert.alert(t('removeDish.title'), t('removeDish.body', { dish: dishName }), [
      { text: t('removeDish.cancel'), style: 'cancel' },
      {
        text: t('removeDish.confirm'),
        style: 'destructive',
        onPress: () => removeEntry.mutate(entryId),
      },
    ]);
  }

  const toggleBookmark = useMutation({
    mutationFn: async ({ recipeId, save }: { recipeId: string; save: boolean }) => {
      if (save) await api.recipes.bookmark(recipeId);
      else await api.recipes.unbookmark(recipeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', 'bookmarks'] }),
  });

  // Localized weekday name via Intl
  const weekDates = planWeekDates(weekStartIso());
  const dayName = weekDates[dow]?.toLocaleDateString(i18n.language, { weekday: 'long' }) ?? '';
  const mealName = tMealTypes(mealType);
  const title = t('title', { day: dayName, meal: mealName });

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky top bar */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBtn}>
              <Icon name="arrow-back" color="primary" size={24} />
            </Pressable>
            <Text variant="headlineMd" numberOfLines={1} style={styles.topTitle}>
              {title}
            </Text>
          </View>
          <View style={styles.topRight}>
            <Pressable hitSlop={8} style={styles.topBtn}>
              <Icon name="share-outline" color="textSecondary" size={22} />
            </Pressable>
            <Pressable hitSlop={8} style={styles.topBtn}>
              <Icon name="notifications-outline" color="textSecondary" size={22} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {plan.isLoading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {plan.error && (
          <Text variant="bodyMd" color="danger">
            {t('loadError', { error: (plan.error as Error).message })}
          </Text>
        )}

        {plan.data && (
          <>
            {/* Macro bento */}
            <View style={styles.bento}>
              {/* Total calories — full width */}
              <View style={[styles.bentoCard, styles.bentoFull]}>
                <Text variant="labelLg" color="primary" style={styles.bentoLabelTop}>
                  {t('totalCalories')}
                </Text>
                <View style={styles.kcalRow}>
                  <Text variant="displayLg">{Math.round(macros.kcal).toLocaleString()}</Text>
                  <Text variant="labelLg" color="textSecondary">
                    kcal
                  </Text>
                </View>
                <ProgressBar value={kcalPct} color={theme.colors.primaryContainer} />
              </View>

              {/* Protein */}
              <View style={[styles.bentoCard, styles.bentoHalf]}>
                <View style={styles.bentoLabelRow}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                  <Text variant="labelSm" color="textSecondary">
                    {t('protein')}
                  </Text>
                </View>
                <Text variant="headlineMd">{Math.round(macros.proteinG)}g</Text>
              </View>

              {/* Carbs */}
              <View style={[styles.bentoCard, styles.bentoHalf]}>
                <View style={styles.bentoLabelRow}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.tertiary }]} />
                  <Text variant="labelSm" color="textSecondary">
                    {t('carbs')}
                  </Text>
                </View>
                <Text variant="headlineMd">{Math.round(macros.carbsG)}g</Text>
              </View>

              {/* Healthy fats — full width */}
              <View style={[styles.bentoCard, styles.bentoFull]}>
                <View style={styles.bentoFatRow}>
                  <View style={styles.bentoLabelRow}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.borderStrong }]} />
                    <Text variant="labelSm" color="textSecondary">
                      {t('healthyFats')}
                    </Text>
                  </View>
                  <Text variant="labelLg">{Math.round(macros.fatG)}g</Text>
                </View>
                <ProgressBar value={fatPct} color={theme.colors.borderStrong} thin />
              </View>
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text variant="headlineLg">{t('yourMeal')}</Text>
            </View>

            {/* Dish list — multiple dishes per slot, each removable. */}
            <View style={styles.dishList}>
              {entries.length === 0 && (
                <View style={styles.empty}>
                  <Text variant="bodyMd" color="textSecondary" align="center">
                    {t('empty')}
                  </Text>
                </View>
              )}

              {entries.map((e) =>
                e.recipe ? (
                  <DishCard
                    key={e.id}
                    entry={e}
                    recipe={e.recipe}
                    bookmarked={bookmarkedIds.has(e.recipe.id)}
                    onPress={() =>
                      router.push({ pathname: '/recipe/[id]', params: { id: e.recipe!.id } })
                    }
                    onToggleBookmark={() =>
                      toggleBookmark.mutate({
                        recipeId: e.recipe!.id,
                        save: !bookmarkedIds.has(e.recipe!.id),
                      })
                    }
                    onRemove={() =>
                      handleRemoveDish(
                        e.id,
                        pickLocalized(e.recipe!.title, e.recipe!.titleI18n, i18n.language),
                      )
                    }
                  />
                ) : null,
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky CTA — Add another item */}
      {plan.data && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={t('addAnother', { meal: mealName.toLowerCase() })}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Icon name="add-circle-outline" color="onPrimary" size={22} />}
            onPress={() => setPickerOpen(true)}
            loading={addEntry.isPending}
          />
        </View>
      )}

      <RecipePickerModal
        visible={pickerOpen}
        mealType={mealType}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipe) => {
          addEntry.mutate(recipe.id);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

// ─── Subcomponents ────────────────────────────────────────

interface DishCardProps {
  entry: MealPlanEntry;
  recipe: Recipe;
  bookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
  /** Optional — when set, renders a trash button that fires this callback. */
  onRemove?: () => void;
}

function DishCard({ recipe, bookmarked, onPress, onToggleBookmark, onRemove }: DishCardProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { i18n } = useTranslation('meal');

  const totalMin = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);
  const firstTag = recipe.tags[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.dishCard, pressed && styles.dishCardPressed]}
    >
      {/* Image with heart overlay */}
      <View style={styles.dishImageWrap}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.dishImage} />
        ) : (
          <View style={[styles.dishImage, styles.dishImageFallback]}>
            <Icon name="restaurant-outline" color="textMuted" size={32} />
          </View>
        )}
        <Pressable onPress={onToggleBookmark} hitSlop={6} style={styles.heartOverlay}>
          <Icon
            name={bookmarked ? 'heart' : 'heart-outline'}
            color={bookmarked ? 'tertiary' : 'textMuted'}
            size={18}
          />
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.dishBody}>
        <View>
          <Text variant="headlineMd" numberOfLines={1}>
            {pickLocalized(recipe.title, recipe.titleI18n, i18n.language)}
          </Text>
          <View style={styles.dishMetaRow}>
            {totalMin > 0 && (
              <View style={styles.dishMetaItem}>
                <Icon name="timer-outline" color="textSecondary" size={14} />
                <Text variant="labelSm" color="textSecondary">
                  {totalMin} min
                </Text>
              </View>
            )}
            {recipe.caloriesPerServing != null && (
              <View style={styles.dishMetaItem}>
                <Icon name="flash-outline" color="textSecondary" size={14} />
                <Text variant="labelSm" color="textSecondary">
                  {Math.round(recipe.caloriesPerServing)} kcal
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.dishFooter}>
          {firstTag ? (
            <Chip
              label={capitalize(firstTag)}
              variant="tint"
              tone={isTertiaryTag(firstTag) ? 'tertiary' : 'primary'}
            />
          ) : (
            <View />
          )}
          <View style={styles.dishActions}>
            {onRemove && (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
              >
                <Icon name="trash-outline" color="danger" size={18} />
              </Pressable>
            )}
            <Icon name="chevron-forward" color="textMuted" size={20} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ProgressBar({
  value,
  color,
  thin = false,
}: {
  value: number;
  color: string;
  thin?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: thin ? 4 : 6,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: theme.radius.full,
        }}
      />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function capitalize(s: string): string {
  return s
    .split('-')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join('-');
}

function isTertiaryTag(tag: string): boolean {
  return ['quick', 'easy', 'spicy', 'comfort', 'classic', 'energy', 'no-cook', 'antioxidant'].includes(
    tag.toLowerCase(),
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },

    // Top bar
    topBarSafe: { backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    topLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    topTitle: { flex: 1 },

    scroll: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, gap: theme.spacing.lg },

    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },

    // Macro bento
    bento: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    bentoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
      // soft shadow
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.18 : 0.04,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    bentoFull: { width: '100%', alignItems: 'flex-start' },
    bentoHalf: { flexGrow: 1, flexBasis: '48%' },
    bentoLabelTop: { alignSelf: 'center', letterSpacing: 0.8 },
    kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, alignSelf: 'center' },
    bentoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bentoFatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dot: { width: 8, height: 8, borderRadius: 4 },

    // Section header
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },

    // Dishes
    dishList: { gap: theme.spacing.md },
    empty: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dishCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      height: 128,
      shadowColor: theme.colors.text,
      shadowOpacity: theme.name === 'dark' ? 0.18 : 0.04,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    dishCardPressed: { opacity: 0.94 },
    dishImageWrap: { width: '33.333%', position: 'relative' },
    dishImage: { width: '100%', height: '100%' },
    dishImageFallback: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heartOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 16,
      padding: 6,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    dishBody: {
      flex: 1,
      padding: theme.spacing.md,
      justifyContent: 'space-between',
    },
    dishMetaRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.base },
    dishMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dishFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // Bottom CTA
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    dishActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    removeBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
    },
    removeBtnPressed: { backgroundColor: theme.colors.surfaceVariant },
  });
}
