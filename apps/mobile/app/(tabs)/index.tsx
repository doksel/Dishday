import { useQuery } from '@tanstack/react-query';
import type { DayOfWeek, MealPlan, MealPlanEntry } from '@dishday/types';
import { dayOfWeekMondayFirst, pickLocalized, planWeekDates, weekStartIso } from '@dishday/utils';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { DateCard } from '../../src/components/DateCard';
import { Fab } from '../../src/components/Fab';
import { MealCard } from '../../src/components/MealCard';
import { Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { apiErrorMessage } from '../../src/lib/apiError';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const api = getApi();
  const { t, i18n } = useTranslation('home');

  const me = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.auth.me() });
  const plans = useQuery<MealPlan[]>({
    queryKey: ['meal-plans'],
    queryFn: () => api.mealPlans.list(),
  });

  const week = weekStartIso();
  const weekDates = useMemo(() => planWeekDates(week), [week]);
  const today = new Date();
  const todayDow = dayOfWeekMondayFirst(today);
  const [selectedDow, setSelectedDow] = useState<DayOfWeek>(todayDow);

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<number, number>>({});

  const plan = plans.data?.find((p) => p.weekStart === week);
  const entries = plan?.entries ?? [];

  /**
   * Group entries by day, **de-duped by mealType** — defense against legacy
   * data from before the unique-slot constraint landed (see migration
   * 20260612190000_unique_meal_plan_slot). One slot = one dish.
   *
   * If two rows exist for the same slot, the later one wins (we iterate in
   * order; later entries overwrite earlier ones in the inner map).
   */
  const entriesByDay = useMemo(() => {
    const map = new Map<number, MealPlanEntry[]>();
    const slotIndex = new Map<string, number>(); // `${dow}|${mealType}` → index in arr
    for (const e of entries) {
      const arr = map.get(e.dayOfWeek) ?? [];
      const key = `${e.dayOfWeek}|${e.mealType}`;
      const prev = slotIndex.get(key);
      if (prev !== undefined) {
        arr[prev] = e; // overwrite — later wins
      } else {
        slotIndex.set(key, arr.length);
        arr.push(e);
      }
      map.set(e.dayOfWeek, arr);
    }
    return map;
  }, [entries]);

  // Total meals = unique slot count (not raw entry count, which could be inflated).
  const totalMeals = useMemo(
    () => Array.from(entriesByDay.values()).reduce((sum, arr) => sum + arr.length, 0),
    [entriesByDay],
  );

  function handleDatePress(dow: DayOfWeek) {
    setSelectedDow(dow);
    const y = sectionY.current[dow];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
  }

  function captureSectionY(dow: number) {
    return (e: LayoutChangeEvent) => {
      sectionY.current[dow] = e.nativeEvent.layout.y;
    };
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          userName={me.data?.name}
          avatarUrl={me.data?.avatarUrl}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />

        <View style={styles.hero}>
          <Text variant="headlineLg">{t('title')}</Text>
          <Text variant="bodyMd" color="textSecondary">
            {totalMeals > 0
              ? t('subtitle', { count: totalMeals })
              : t('emptySubtitle')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {weekDates.map((date, idx) => (
            <DateCard
              key={idx}
              dayName={date.toLocaleDateString(i18n.language, { weekday: 'short' })}
              dayOfMonth={date.getDate()}
              active={idx === selectedDow}
              onPress={() => handleDatePress(idx as DayOfWeek)}
            />
          ))}
        </ScrollView>

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

        {!plans.isLoading && !plan && (
          <View style={styles.empty}>
            <Text variant="bodyMd" color="textSecondary" align="center">
              {t('emptyPlan')}
            </Text>
          </View>
        )}

        {plan &&
          weekDates.map((date, dow) => {
            const dayEntries = entriesByDay.get(dow) ?? [];
            if (dayEntries.length === 0) return null;
            const dayKcal = dayEntries.reduce(
              (sum, e) => sum + (e.recipe?.caloriesPerServing ?? 0) * e.servings,
              0,
            );
            return (
              <View key={dow} style={styles.daySection} onLayout={captureSectionY(dow)}>
                <View style={styles.dayHeader}>
                  <Text variant="headlineMd">
                    {date.toLocaleDateString(i18n.language, { weekday: 'long' })}
                  </Text>
                  <Text variant="labelLg" color="tertiary">
                    {t('kcal', { value: Math.round(dayKcal).toLocaleString(i18n.language) })}
                  </Text>
                </View>
                <View style={styles.mealList}>
                  {dayEntries.map((entry) => (
                    <MealCard
                      key={entry.id}
                      imageUrl={entry.recipe?.imageUrl}
                      mealType={entry.mealType}
                      title={
                        entry.recipe
                          ? pickLocalized(entry.recipe.title, entry.recipe.titleI18n, i18n.language)
                          : '—'
                      }
                      onPress={() =>
                        plan &&
                        router.push({
                          pathname: '/meal',
                          params: {
                            planId: plan.id,
                            dow: String(entry.dayOfWeek),
                            mealType: entry.mealType,
                          },
                        })
                      }
                      onActionPress={() =>
                        plan &&
                        router.push({
                          pathname: '/meal',
                          params: {
                            planId: plan.id,
                            dow: String(entry.dayOfWeek),
                            mealType: entry.mealType,
                          },
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            );
          })}
      </ScrollView>

      {plan && <Fab icon="calendar-outline" onPress={() => router.push('/(tabs)/planner')} />}
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: 100,
      gap: theme.spacing.lg,
    },
    hero: { gap: theme.spacing.sm },
    dateRow: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.base,
    },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    empty: {
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
    },
    daySection: { gap: theme.spacing.md },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mealList: { gap: theme.spacing.md },
  });
}
