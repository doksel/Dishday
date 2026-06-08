import { useQuery } from '@tanstack/react-query';
import type { DayOfWeek, MealPlan, MealPlanEntry } from '@dishday/types';
import { dayOfWeekMondayFirst, planWeekDates, weekStartIso } from '@dishday/utils';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { DateCard } from '../../src/components/DateCard';
import { Fab } from '../../src/components/Fab';
import { MealCard } from '../../src/components/MealCard';
import { Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const api = getApi();

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

  const plan = plans.data?.find((p) => p.weekStart === week);
  const entries = plan?.entries ?? [];
  const totalMeals = entries.length;

  // Group entries by day-of-week
  const entriesByDay = useMemo(() => {
    const map = new Map<number, MealPlanEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.dayOfWeek) ?? [];
      arr.push(e);
      map.set(e.dayOfWeek, arr);
    }
    return map;
  }, [entries]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          userName={me.data?.name}
          avatarUrl={me.data?.avatarUrl}
          onNotificationsPress={() => {
            // TODO: open notifications screen
          }}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />

        {/* Hero */}
        <View style={styles.hero}>
          <Text variant="headlineLg">Your Weekly Plan</Text>
          <Text variant="bodyMd" color="textSecondary" style={styles.heroSubtitle}>
            {totalMeals > 0
              ? `You have ${totalMeals} meal${totalMeals === 1 ? '' : 's'} planned for this week. Stay nourished!`
              : "No meals planned yet — pick a recipe to start filling your week."}
          </Text>
        </View>

        {/* Date scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {weekDates.map((date, idx) => (
            <DateCard
              key={idx}
              dayName={date.toLocaleDateString('en', { weekday: 'short' })}
              dayOfMonth={date.getDate()}
              active={idx === selectedDow}
              onPress={() => setSelectedDow(idx as DayOfWeek)}
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
            Could not load plan: {(plans.error as Error).message}
          </Text>
        )}

        {!plans.isLoading && !plan && (
          <View style={styles.empty}>
            <Text variant="bodyMd" color="textSecondary" align="center">
              No plan yet for this week. Open the Planner tab to create one.
            </Text>
          </View>
        )}

        {/* Day sections */}
        {plan &&
          weekDates.map((date, dow) => {
            const dayEntries = entriesByDay.get(dow) ?? [];
            if (dayEntries.length === 0) return null;
            const dayKcal = dayEntries.reduce(
              (sum, e) => sum + (e.recipe?.caloriesPerServing ?? 0) * e.servings,
              0,
            );
            return (
              <View key={dow} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text variant="headlineMd">
                    {date.toLocaleDateString('en', { weekday: 'long' })}
                  </Text>
                  <Text variant="labelLg" color="tertiary">
                    {Math.round(dayKcal).toLocaleString()} kcal
                  </Text>
                </View>
                <View style={styles.mealList}>
                  {dayEntries.map((entry) => (
                    <MealCard
                      key={entry.id}
                      imageUrl={entry.recipe?.imageUrl}
                      mealType={entry.mealType}
                      title={entry.recipe?.title ?? '—'}
                      onPress={() => {
                        // TODO: navigate to recipe detail
                      }}
                      onActionPress={() => router.push('/(tabs)/planner')}
                    />
                  ))}
                </View>
              </View>
            );
          })}
      </ScrollView>

      {plan && (
        <Fab icon="calendar-outline" onPress={() => router.push('/(tabs)/planner')} />
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: 100, // room for FAB
      gap: theme.spacing.lg,
    },
    hero: { gap: theme.spacing.sm },
    heroSubtitle: {},
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
