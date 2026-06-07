import { useQuery } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { dayOfWeekMondayFirst, weekStartIso } from '@dishday/utils';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { getApi } from '../../src/lib/api';
import { useTheme } from '../../src/theme';

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const SLOT_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function TodayScreen() {
  const theme = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.text }}>Today</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{now.toLocaleDateString()}</Text>

        {isLoading && (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {error && (
          <Text style={{ color: theme.colors.danger }}>
            Could not load today's plan: {(error as Error).message}
          </Text>
        )}

        {!isLoading && !plan && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.textSecondary }}>
              No plan for this week yet. Open the Planner tab to create one.
            </Text>
          </View>
        )}

        {plan &&
          SLOTS.map((slot) => {
            const entry = plan.entries?.find((e) => e.dayOfWeek === dow && e.mealType === slot);
            return (
              <View
                key={slot}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  {SLOT_LABEL[slot].toUpperCase()}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 16,
                    fontWeight: '600',
                    color: entry ? theme.colors.text : theme.colors.textMuted,
                  }}
                >
                  {entry?.recipe?.title ?? '—'}
                </Text>
                {entry?.recipe?.caloriesPerServing != null && (
                  <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textSecondary }}>
                    {Math.round(entry.recipe.caloriesPerServing)} kcal · {entry.servings} serving
                    {entry.servings === 1 ? '' : 's'}
                  </Text>
                )}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
