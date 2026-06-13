import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@dishday/api-client';
import { pickLocalized } from '@dishday/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recipe } from '@dishday/types';
import { PaywallModal, type PaywallContext } from '../../src/components/PaywallModal';
import { RecipeRewriteModal } from '../../src/components/RecipeRewriteModal';
import { Button, Checkbox, Chip, Icon, Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

/**
 * Tag → (icon, tone). Lets common tags render as colored chips
 * with leading icons (Vegan with leaf, Easy with flame, etc).
 * Unknown tags fall back to a neutral chip without icon.
 */
const TAG_META: Record<
  string,
  { iconName: React.ComponentProps<typeof Icon>['name']; tone: 'primary' | 'tertiary' }
> = {
  vegan: { iconName: 'leaf', tone: 'primary' },
  vegetarian: { iconName: 'leaf-outline', tone: 'primary' },
  'gluten-free': { iconName: 'leaf-outline', tone: 'primary' },
  pescetarian: { iconName: 'fish-outline', tone: 'primary' },
  'high-protein': { iconName: 'barbell-outline', tone: 'primary' },
  'high-fiber': { iconName: 'leaf-outline', tone: 'primary' },
  'low-carb': { iconName: 'remove-circle-outline', tone: 'primary' },
  keto: { iconName: 'leaf', tone: 'primary' },
  quick: { iconName: 'flash', tone: 'tertiary' },
  easy: { iconName: 'flame-outline', tone: 'tertiary' },
  spicy: { iconName: 'flame', tone: 'tertiary' },
  comfort: { iconName: 'heart-outline', tone: 'tertiary' },
  classic: { iconName: 'star-outline', tone: 'tertiary' },
  energy: { iconName: 'flash', tone: 'tertiary' },
  'no-cook': { iconName: 'snow-outline', tone: 'tertiary' },
};

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = getApi();
  const { t, i18n } = useTranslation('recipe');

  const [saved, setSaved] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  /** null = closed; otherwise the framing for the upsell screen. */
  const [paywallContext, setPaywallContext] = useState<PaywallContext | null>(null);
  const paywallOpen = paywallContext !== null;
  function setPaywallOpen(open: boolean, context: PaywallContext = 'aiGenerate') {
    setPaywallContext(open ? context : null);
  }
  const [rewriteOpen, setRewriteOpen] = useState(false);

  // Need plan to decide whether to open the rewrite modal or the paywall.
  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });
  const isPro = me.data?.plan === 'pro' || me.data?.plan === 'admin';

  function handleRewritePress() {
    if (!isPro) {
      setPaywallOpen(true, 'aiGenerate');
      return;
    }
    setRewriteOpen(true);
  }

  const recipe = useQuery<Recipe>({
    queryKey: ['recipe', id],
    queryFn: () => api.recipes.get(id),
    enabled: !!id,
    // Don't retry on 402 — it's a deterministic gate, not a transient failure.
    retry: (count, err) => !(err instanceof ApiClientError && err.status === 402) && count < 2,
  });

  /**
   * 402 PLAN_REQUIRED → server attaches a `teaser` with the recipe title so we
   * can still render a header and meaningful paywall ("Unlock 'Avocado toast'").
   */
  const planRequired =
    recipe.error instanceof ApiClientError && recipe.error.status === 402
      ? recipe.error
      : null;
  const teaser =
    (planRequired?.body as { teaser?: { id: string; title: string } } | null)?.teaser ??
    null;

  function toggleIngredient(ingId: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }

  async function toggleSaved() {
    const next = !saved;
    setSaved(next);
    try {
      if (next) await api.recipes.bookmark(id);
      else await api.recipes.unbookmark(id);
    } catch (err) {
      // Revert optimistic toggle.
      setSaved(!next);
      // Free users hit the bookmark cap → server returns 402 LIMIT_REACHED.
      // Open the paywall with bookmark-specific framing instead of a silent failure.
      if (
        err instanceof ApiClientError &&
        err.status === 402 &&
        err.body?.code === 'LIMIT_REACHED'
      ) {
        setPaywallOpen(true, 'bookmarks');
      }
    }
  }

  const totalMins = (recipe.data?.prepTimeMin ?? 0) + (recipe.data?.cookTimeMin ?? 0);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky top bar */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBtn}>
            <Icon name="chevron-back" color="text" size={24} />
          </Pressable>
          <Text variant="headlineMd" color="primary">
            Dishday
          </Text>
          <Pressable onPress={toggleSaved} hitSlop={8} style={styles.topBtn}>
            <Icon name={saved ? 'heart' : 'heart-outline'} color={saved ? 'tertiary' : 'text'} size={24} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {recipe.isLoading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {recipe.error && !planRequired && (
          <View style={styles.body}>
            <Text variant="bodyMd" color="danger">
              {t('loadError', { error: (recipe.error as Error).message })}
            </Text>
          </View>
        )}

        {planRequired && (
          <View style={styles.lockedWrap}>
            {/* Blurred placeholder hero with lock badge */}
            <View style={[styles.hero, styles.heroFallback, styles.heroLocked]}>
              <Icon name="lock-closed" color="onPrimary" size={48} />
            </View>
            <View style={styles.body}>
              <Text variant="headlineLg">{teaser?.title ?? '—'}</Text>
              <Text variant="bodyMd" color="textSecondary" style={styles.lockedBody}>
                {t('lockedBody', {
                  defaultValue:
                    'This recipe is part of your Pro menu preview. Upgrade to see full ingredients and instructions.',
                })}
              </Text>
              <Button
                label={t('lockedCta', { defaultValue: 'Upgrade to Pro' })}
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => setPaywallOpen(true)}
                style={styles.lockedCta}
              />
            </View>
          </View>
        )}

        {recipe.data && (
          <>
            {/* Hero image with time pill */}
            <View style={styles.heroWrap}>
              {recipe.data.imageUrl ? (
                <Image source={{ uri: recipe.data.imageUrl }} style={styles.hero} />
              ) : (
                <View style={[styles.hero, styles.heroFallback]}>
                  <Icon name="restaurant-outline" color="textMuted" size={64} />
                </View>
              )}
              {totalMins > 0 && (
                <View style={styles.timePill}>
                  <Icon name="time-outline" color="primary" size={16} />
                  <Text variant="labelLg" color="text">
                    {formatDuration(totalMins, t)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.body}>
              {/* Tags */}
              {recipe.data.tags.length > 0 && (
                <View style={styles.tags}>
                  {recipe.data.tags.map((tag) => {
                    const meta = TAG_META[tag.toLowerCase()];
                    return (
                      <Chip
                        key={tag}
                        label={capitalize(tag)}
                        variant="tint"
                        tone={meta?.tone ?? 'primary'}
                        iconName={meta?.iconName}
                      />
                    );
                  })}
                </View>
              )}

              {/* Title + description */}
              <Text variant="headlineLg" style={styles.title}>
                {pickLocalized(recipe.data.title, recipe.data.titleI18n, i18n.language)}
              </Text>
              {recipe.data.description && (
                <Text variant="bodyMd" color="textSecondary">
                  {pickLocalized(
                    recipe.data.description,
                    recipe.data.descriptionI18n,
                    i18n.language,
                  )}
                </Text>
              )}

              {/* Nutrition */}
              <View style={styles.nutrition}>
                <NutritionItem
                  label="kcal"
                  value={Math.round(recipe.data.caloriesPerServing ?? 0).toLocaleString()}
                  color="tertiary"
                />
                <View style={styles.divider} />
                <NutritionItem
                  label="protein"
                  value={`${Math.round(recipe.data.proteinG ?? 0)}g`}
                  color="text"
                />
                <View style={styles.divider} />
                <NutritionItem
                  label="carbs"
                  value={`${Math.round(recipe.data.carbsG ?? 0)}g`}
                  color="text"
                />
                <View style={styles.divider} />
                <NutritionItem
                  label="fat"
                  value={`${Math.round(recipe.data.fatG ?? 0)}g`}
                  color="text"
                />
              </View>

              {/* Ingredients */}
              {recipe.data.ingredients && recipe.data.ingredients.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text variant="headlineMd">{t('ingredients')}</Text>
                    <Text variant="labelLg" color="primary">
                      {t('items', { count: recipe.data.ingredients.length })}
                    </Text>
                  </View>
                  <View style={styles.ingredientsList}>
                    {recipe.data.ingredients.map((ing) => {
                      const checked = checkedIngredients.has(ing.id);
                      const name = pickLocalized(ing.name, ing.nameI18n, i18n.language);
                      const label = `${formatQuantity(ing.quantity)}${ing.unit ? ' ' + ing.unit : ''} ${name}${ing.notes ? `, ${ing.notes}` : ''}`;
                      return (
                        <Checkbox
                          key={ing.id}
                          checked={checked}
                          onChange={() => toggleIngredient(ing.id)}
                          label={label}
                          strikeThrough
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* The Process */}
              {recipe.data.description && (
                <View style={styles.processBox}>
                  <Text variant="labelLg" color="textSecondary" style={styles.processLabel}>
                    {t('process')}
                  </Text>
                  <Text variant="bodyMd" color="textSecondary" style={styles.processBody}>
                    {pickLocalized(
                      recipe.data.description,
                      recipe.data.descriptionI18n,
                      i18n.language,
                    )}
                  </Text>
                </View>
              )}

              {/* AI rewrite — Pro feature. Free users see the button but
                  tapping opens the paywall instead. */}
              <Pressable
                onPress={handleRewritePress}
                style={({ pressed }) => [styles.rewriteBtn, pressed && styles.rewriteBtnPressed]}
              >
                <View style={styles.rewriteIcon}>
                  <Icon
                    name={isPro ? 'sparkles' : 'lock-closed'}
                    color="onPrimary"
                    size={20}
                  />
                </View>
                <View style={styles.rewriteText}>
                  <Text variant="bodyLg" style={styles.rewriteTitle}>
                    {t('rewrite.button')}
                  </Text>
                  <Text variant="labelSm" color="textSecondary">
                    {t('rewrite.buttonHint')}
                  </Text>
                </View>
                <Icon name="chevron-forward" color="textMuted" size={18} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      {recipe.data && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={t('startCooking')}
            variant="tertiary"
            size="lg"
            fullWidth
            leftIcon={<Icon name="play-circle" color="onTertiary" size={22} />}
            onPress={() => {
              // TODO: open cooking mode (step-by-step instructions)
            }}
          />
        </View>
      )}

      <RecipeRewriteModal
        visible={rewriteOpen}
        recipeId={recipe.data?.id ?? null}
        onClose={() => setRewriteOpen(false)}
      />

      <PaywallModal
        visible={paywallOpen}
        context={paywallContext ?? undefined}
        onClose={() => setPaywallContext(null)}
      />
    </View>
  );
}

// ─── Helpers / sub-components ─────────────────────────────

function NutritionItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'primary' | 'tertiary' | 'text';
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.nutritionItem}>
      <Text variant="bodyLg" color={color} style={styles.nutritionValue}>
        {value}
      </Text>
      <Text variant="labelSm" color="textMuted" style={styles.nutritionLabel}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function formatDuration(totalMins: number, t: (k: string, opts?: Record<string, unknown>) => string): string {
  if (totalMins < 60) return t('min', { value: totalMins, count: totalMins });
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m === 0 ? t('hour', { h }) : t('hourMin', { h, m });
}

function formatQuantity(q: number): string {
  if (Number.isInteger(q)) return q.toString();
  return q.toFixed(q < 1 ? 2 : 1).replace(/\.?0+$/, '');
}

function capitalize(s: string): string {
  return s
    .split('-')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join('-');
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },

    // Top bar
    topBarSafe: {
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    scroll: {},

    // Hero
    heroWrap: { width: '100%', height: 320, position: 'relative' },
    hero: { width: '100%', height: '100%' },
    heroFallback: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timePill: {
      position: 'absolute',
      left: theme.spacing.md,
      bottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    body: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.md,
    },

    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },

    title: { marginTop: theme.spacing.xs },

    // Nutrition
    nutrition: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    nutritionItem: { flex: 1, alignItems: 'center', gap: 2 },
    nutritionValue: { fontWeight: '700' },
    nutritionLabel: { letterSpacing: 0.8 },
    divider: { width: 1, alignSelf: 'stretch', backgroundColor: theme.colors.border, marginHorizontal: 4 },

    // Sections
    section: { gap: theme.spacing.sm },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ingredientsList: { gap: theme.spacing.base },

    // The Process box
    processBox: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    processLabel: { letterSpacing: 1 },
    processBody: {},

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

    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },

    // Locked (402 PLAN_REQUIRED) preview-only state
    lockedWrap: { gap: theme.spacing.md },
    heroLocked: { backgroundColor: theme.colors.primary },
    lockedBody: { marginTop: theme.spacing.sm },
    lockedCta: { marginTop: theme.spacing.lg },

    // AI rewrite CTA row
    rewriteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: theme.spacing.md,
    },
    rewriteBtnPressed: { opacity: 0.85 },
    rewriteIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewriteText: { flex: 1, gap: 2 },
    rewriteTitle: { fontWeight: '600' },
  });
}
