import { useQuery } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { dayOfWeekMondayFirst, weekStartIso } from '@dishday/utils';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { getApi } from '../../src/lib/api';
import { useThemedStyles, useTheme, type Theme } from '../../src/theme';

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const SLOT_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function TodayScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const api = getApi();
  const now = new Date();
  const week = weekStartIso(now);
  const dow = dayOfWeekMondayFirst(now);

  const { data, isLoading, error } = useQuery<MealPlan[]>({
    queryKey: ['meal-plans'],
    queryFn: () => api.mealPlans.list(),
  });

  const plan = data?.find((p) => p.weekStart === week);

  return (
    <Screen variant="scroll" gap="md">
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>{now.toLocaleDateString()}</Text>

      {isLoading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {error && (
        <Text style={styles.error}>Could not load today's plan: {(error as Error).message}</Text>
      )}

      {!isLoading && !plan && (
        <View style={styles.card}>
          <Text style={styles.cardMutedBody}>
            No plan for this week yet. Open the Planner tab to create one.
          </Text>
        </View>
      )}

      {plan &&
        SLOTS.map((slot) => {
          const entry = plan.entries?.find((e) => e.dayOfWeek === dow && e.mealType === slot);
          return (
            <View key={slot} style={styles.card}>
              <Text style={styles.slotLabel}>{SLOT_LABEL[slot].toUpperCase()}</Text>
              <Text style={entry ? styles.slotTitle : styles.slotTitleEmpty}>
                {entry?.recipe?.title ?? '—'}
              </Text>
              {entry?.recipe?.caloriesPerServing != null && (
                <Text style={styles.slotMeta}>
                  {Math.round(entry.recipe.caloriesPerServing)} kcal · {entry.servings} serving
                  {entry.servings === 1 ? '' : 's'}
                </Text>
              )}
            </View>
          );
        })}
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    subtitle: { color: theme.colors.textSecondary },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { color: theme.colors.danger },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardMutedBody: { color: theme.colors.textSecondary },
    slotLabel: { fontSize: 12, color: theme.colors.textMuted },
    slotTitle: { marginTop: 4, fontSize: 16, fontWeight: '600', color: theme.colors.text },
    slotTitleEmpty: { marginTop: 4, fontSize: 16, fontWeight: '600', color: theme.colors.textMuted },
    slotMeta: { marginTop: 4, fontSize: 12, color: theme.colors.textSecondary },
  });
}
