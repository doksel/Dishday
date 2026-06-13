'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { ModerationStatus } from '@dishday/api-client';
import type { Recipe } from '@dishday/types';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { RecipeReviewSheet } from '@/components/RecipeReviewSheet';
import { getApi } from '@/lib/api';

type ModColumns = Pick<Recipe, 'id' | 'title' | 'source' | 'isPublic' | 'isApproved' | 'createdAt'>;

const TAB_LABELS: Record<ModerationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
};

export default function AdminRecipesPage() {
  const api = getApi();
  const qc = useQueryClient();

  const [status, setStatus] = useState<ModerationStatus>('pending');
  const [openId, setOpenId] = useState<string | null>(null);

  const recipesQ = useQuery({
    queryKey: ['admin-recipes', status],
    queryFn: () => api.admin.listRecipes({ status, pageSize: 100 }),
  });

  /**
   * Row-level approve/reject mutations — fast path so the moderator can clear
   * the queue without opening each sheet. The sheet still handles individual
   * decisions for cases that need a closer look.
   */
  const approve = useMutation({
    mutationFn: (id: string) => api.admin.approveRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipes'] }),
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.admin.rejectRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipes'] }),
  });

  const columns: ColumnDef<ModColumns>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row, getValue }) => (
        <button
          type="button"
          onClick={() => setOpenId(row.original.id)}
          className="text-left font-medium text-zinc-900 hover:text-emerald-700"
        >
          {getValue<string>()}
        </button>
      ),
    },
    { accessorKey: 'source', header: 'Source' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge recipe={row.original} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => reject.mutate(row.original.id)}
            disabled={reject.isPending}
            className="rounded border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => approve.mutate(row.original.id)}
            disabled={approve.isPending}
            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      ),
    },
  ];

  const items = recipesQ.data?.items ?? [];

  return (
    <main className="px-8 py-10">
      <h1 className="text-2xl font-bold">Recipe moderation</h1>
      <p className="mt-1 text-sm text-zinc-600">
        User-submitted recipes awaiting approval. Tap a title to preview the full content.
      </p>

      <div className="mt-6 flex gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
        {(Object.keys(TAB_LABELS) as ModerationStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={
              'flex-1 rounded px-3 py-1.5 transition ' +
              (status === key
                ? 'bg-white font-semibold text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900')
            }
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {recipesQ.isLoading && (
          <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Loading…
          </p>
        )}
        {recipesQ.error && (
          <p className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
            Failed to load recipes.
          </p>
        )}
        {!recipesQ.isLoading && !recipesQ.error && items.length === 0 && (
          <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Nothing to review here.
          </p>
        )}
        {items.length > 0 && <DataTable data={items} columns={columns} />}
      </div>

      <RecipeReviewSheet recipeId={openId} onClose={() => setOpenId(null)} />
    </main>
  );
}

function StatusBadge({ recipe }: { recipe: ModColumns }) {
  if (!recipe.isPublic) {
    return (
      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">Rejected</span>
    );
  }
  if (recipe.isApproved) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
        Approved
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending</span>
  );
}
