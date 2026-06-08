import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlan, MealType } from '@dishday/types';
import { weekStartIso } from '@dishday/utils';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
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
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

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
    onSuccess: (data) => setPendingJobId(data.jobId),
  });

  // Poll the AI job until completed/failed.
  const aiJob = useQuery({
    queryKey: ['ai-job', pendingJobId],
    queryFn: () => api.mealPlans.aiJob(pendingJobId!),
    enabled: !!pendingJobId,
    refetchInterval: (q) => {
      const state = q.state.data?.state;
      if (state === 'completed' || state === 'failed') return false;
      return 2000;
    },
  });

  // When the job finishes, refresh plans and clear the pending pointer.
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

  return (
    <Screen variant="scroll" gap="md">
      <Text style={styles.title}>Week of {week}</Text>

      {plans.isLoading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {plans.error && (
        <Text style={styles.error}>Could not load plans: {(plans.error as Error).message}</Text>
      )}

      {aiPending && (
        <View style={styles.banner}>
          <ActivityIndicator color={theme.colors.onPrimary} />
          <Text style={styles.bannerText}>Generating your meal plan…</Text>
        </View>
      )}

      {aiJob.data?.state === 'failed' && aiJob.data.failedReason && (
        <Text style={styles.error}>AI generation failed: {aiJob.data.failedReason}</Text>
      )}

      {!plans.isLoading && !currentPlan && !aiPending && (
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
              style={styles.btnSecondary}
            >
              <Text style={styles.btnSecondaryText}>AI generate</Text>
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
                  style={[styles.slotRow, slot !== 'snack' && styles.slotRowDivider]}
                >
                  <Text style={styles.slotName}>{slot}</Text>
                  <Text style={entry ? styles.slotEntry : styles.slotEntryEmpty} numberOfLines={1}>
                    {entry?.recipe?.title ?? '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { color: theme.colors.danger },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    bannerText: { color: theme.colors.onPrimary, fontWeight: '600' },
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
