'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from '@dishday/ui';
import { weekStartIso } from '@dishday/utils';
import type { MealPlan, MealType } from '@dishday/types';
import { getApi } from '@/lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function PlannerPage() {
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
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Week of {week}</h1>
          <p className="mt-1 text-zinc-600">Plan breakfast, lunch, dinner and a snack for each day.</p>
        </div>
        <div className="flex gap-2">
          {!currentPlan && (
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Start an empty plan'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => aiGenerate.mutate()} disabled={aiGenerate.isPending}>
            {aiGenerate.isPending ? 'Queueing…' : 'AI-generate (Pro)'}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-7">
        {DAYS.map((day, dayIdx) => (
          <Card key={day} className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-zinc-700">{day}</div>
            {SLOTS.map((slot) => {
              const entry = currentPlan?.entries?.find(
                (e) => e.dayOfWeek === dayIdx && e.mealType === slot,
              );
              return (
                <div
                  key={slot}
                  className="rounded-md border border-dashed border-zinc-200 px-2 py-2 text-xs"
                >
                  <div className="font-medium capitalize text-zinc-500">{slot}</div>
                  <div className="mt-1 text-zinc-900">
                    {entry?.recipe?.title ?? <span className="text-zinc-400">—</span>}
                  </div>
                </div>
              );
            })}
          </Card>
        ))}
      </div>
    </main>
  );
}
