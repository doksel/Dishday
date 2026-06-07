import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { weekStartIso } from '@dishday/utils';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getApi } from '../../src/lib/api';
import { useThemedStyles, useTheme, type Theme } from '../../src/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function PlannerScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
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
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Week of {week}</Text>

        {plans.isLoading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {plans.error && (
          <Text style={styles.error}>Could not load plans: {(plans.error as Error).message}</Text>
        )}

        {!plans.isLoading && !currentPlan && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No plan for this week yet</Text>
            <Text style={styles.cardBody}>
              Start an empty plan and add recipes manually, or let AI build a balanced week for you.
            </Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => create.mutate()}
                disabled={create.isPending}
                style={[styles.btnPrimary, create.isPending && styles.disabled]}
              >
                <Text style={styles.btnPrimaryText}>
                  {create.isPending ? 'Creating…' : 'Empty plan'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => aiGenerate.mutate()}
                disabled={aiGenerate.isPending}
                style={[styles.btnSecondary, aiGenerate.isPending && styles.disabled]}
              >
                <Text style={styles.btnSecondaryText}>
                  {aiGenerate.isPending ? 'Queueing…' : 'AI generate'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {currentPlan &&
          DAYS.map((dayLabel, dayIdx) => (
            <View key={dayLabel} style={styles.card}>
              <Text style={styles.dayLabel}>{dayLabel}</Text>
              {SLOTS.map((slot) => {
                const entry = currentPlan.entries?.find(
                  (e) => e.dayOfWeek === dayIdx && e.mealType === slot,
                );
                return (
                  <View
                    key={slot}
                    style={[
                      styles.slotRow,
                      slot !== 'snack' && styles.slotRowDivider,
                    ]}
                  >
                    <Text style={styles.slotName}>{slot}</Text>
                    <Text
                      style={entry ? styles.slotEntry : styles.slotEntryEmpty}
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.xl, gap: theme.spacing.md },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { color: theme.colors.danger },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    cardTitle: { color: theme.colors.text, fontWeight: '600' },
    cardBody: { color: theme.colors.textSecondary },
    row: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    btnPrimary: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    btnPrimaryText: { color: theme.colors.onPrimary, fontWeight: '600' },
    btnSecondary: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    btnSecondaryText: { color: theme.colors.text, fontWeight: '600' },
    disabled: { opacity: 0.6 },
    dayLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    slotRow: { flexDirection: 'row', paddingVertical: 6 },
    slotRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    slotName: {
      width: 80,
      fontSize: 12,
      color: theme.colors.textMuted,
      textTransform: 'capitalize',
    },
    slotEntry: { flex: 1, fontSize: 14, color: theme.colors.text },
    slotEntryEmpty: { flex: 1, fontSize: 14, color: theme.colors.textMuted },
  });
}
