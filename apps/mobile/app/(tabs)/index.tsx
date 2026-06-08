import { useQuery } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { dayOfWeekMondayFirst, weekStartIso } from '@dishday/utils';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card, Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

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
      <View>
        <Text variant="displayLg">Today</Text>
        <Text variant="bodyMd" color="textSecondary">
          {now.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {error && (
        <Text variant="bodyMd" color="danger">
          Could not load today's plan: {(error as Error).message}
        </Text>
      )}

      {!isLoading && !plan && (
        <Card elevation={1}>
          <Text variant="bodyMd" color="textSecondary">
            No plan for this week yet. Open the Planner tab to create one.
          </Text>
        </Card>
      )}

      {plan &&
        SLOTS.map((slot) => {
          const entry = plan.entries?.find((e) => e.dayOfWeek === dow && e.mealType === slot);
          return (
            <Card key={slot} elevation={1}>
              <Text variant="labelSm" color="textMuted">
                {SLOT_LABEL[slot].toUpperCase()}
              </Text>
              <Text
                variant="headlineMd"
                color={entry ? 'text' : 'textMuted'}
                style={styles.slotTitle}
              >
                {entry?.recipe?.title ?? '—'}
              </Text>
              {entry?.recipe?.caloriesPerServing != null && (
                <Text variant="bodyMd" color="textSecondary" style={styles.slotMeta}>
                  {Math.round(entry.recipe.caloriesPerServing)} kcal · {entry.servings} serving
                  {entry.servings === 1 ? '' : 's'}
                </Text>
              )}
            </Card>
          );
        })}
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    slotTitle: { marginTop: theme.spacing.base },
    slotMeta: { marginTop: theme.spacing.base },
  });
}
