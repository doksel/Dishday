'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@dishday/ui';
import { weekStartIso } from '@dishday/utils';
import type { MealPlan, ShoppingList } from '@dishday/types';
import { getApi } from '@/lib/api';

export default function ShoppingPage() {
  const api = getApi();
  const qc = useQueryClient();
  const week = weekStartIso();

  const plans = useQuery<MealPlan[]>({
    queryKey: ['meal-plans'],
    queryFn: () => api.mealPlans.list(),
  });
  const plan = plans.data?.find((p) => p.weekStart === week);

  const list = useQuery<ShoppingList>({
    queryKey: ['shopping-list', plan?.id],
    queryFn: () => api.shoppingLists.forPlan(plan!.id),
    enabled: !!plan,
  });

  const toggle = useMutation({
    mutationFn: ({ listId, itemId, isChecked }: { listId: string; itemId: string; isChecked: boolean }) =>
      api.shoppingLists.toggleItem(listId, itemId, isChecked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-list', plan?.id] }),
  });

  if (!plan) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Shopping list</h1>
        <p className="mt-4 text-zinc-600">Create a meal plan first to generate a shopping list.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Shopping list — week of {week}</h1>
      <Card className="mt-6">
        {list.isLoading && <div className="text-sm text-zinc-500">Loading…</div>}
        {list.data && (
          <ul className="divide-y divide-zinc-100">
            {list.data.items?.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <label className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={(e) =>
                      toggle.mutate({
                        listId: list.data!.id,
                        itemId: item.id,
                        isChecked: e.target.checked,
                      })
                    }
                  />
                  <span className={item.isChecked ? 'text-zinc-400 line-through' : ''}>
                    {item.ingredientName}
                  </span>
                </label>
                <span className="text-sm text-zinc-500">
                  {item.totalQuantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
