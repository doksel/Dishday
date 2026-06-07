import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { weekStartIso } from '@dishday/utils';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { getApi } from '../../src/lib/api';
import { useTheme } from '../../src/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function PlannerScreen() {
  const theme = useTheme();
  const api = getApi();
  const qc = useQueryClient();
  const week = weekStartIso();

  const plans = useQuery<MealPlan[]>({
    queryKey: ['meal-plans'],
    queryFn: () => api.mealPlans.list(),
  });

  const currentPlan = plans.data?.find((p) => p.weekStart === week);

  const create = useMutation({
    mutationFn: () => api.mealPlans.create({ weekStart: week }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  const aiGenerate = useMutation({
    mutationFn: () => api.mealPlans.aiGenerate({ weekStart: week }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.text }}>
          Week of {week}
        </Text>

        {plans.isLoading && (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {plans.error && (
          <Text style={{ color: theme.colors.danger }}>
            Could not load plans: {(plans.error as Error).message}
          </Text>
        )}

        {!plans.isLoading && !currentPlan && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: theme.spacing.sm,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              No plan for this week yet
            </Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              Start an empty plan and add recipes manually, or let AI build a balanced week for you.
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
              <Pressable
                onPress={() => create.mutate()}
                disabled={create.isPending}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  padding: 12,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  opacity: create.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>
                  {create.isPending ? 'Creating…' : 'Empty plan'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => aiGenerate.mutate()}
                disabled={aiGenerate.isPending}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.surfaceVariant,
                  padding: 12,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  opacity: aiGenerate.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                  {aiGenerate.isPending ? 'Queueing…' : 'AI generate'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {currentPlan &&
          DAYS.map((dayLabel, dayIdx) => (
            <View
              key={dayLabel}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                gap: theme.spacing.sm,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>
                {dayLabel}
              </Text>
              {SLOTS.map((slot) => {
                const entry = currentPlan.entries?.find(
                  (e) => e.dayOfWeek === dayIdx && e.mealType === slot,
                );
                return (
                  <View
                    key={slot}
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 6,
                      borderBottomWidth: slot === 'snack' ? 0 : 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        width: 80,
                        fontSize: 12,
                        color: theme.colors.textMuted,
                        textTransform: 'capitalize',
                      }}
                    >
                      {slot}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: entry ? theme.colors.text : theme.colors.textMuted,
                      }}
                      numberOfLines={1}
                    >
                      {entry?.recipe?.title ?? '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
