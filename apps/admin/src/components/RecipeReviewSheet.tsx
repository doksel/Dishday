/**
 * Side sheet showing the full recipe content for moderation.
 *
 *   Opens when an admin clicks a row in the moderation queue. Renders title,
 *   description, image, ingredients, tags, and author info — everything a
 *   moderator needs to decide Approve vs Reject without leaving the page.
 *
 *   Approve  → POST /admin/recipes/:id/approve  (flips isApproved=true)
 *   Reject   → POST /admin/recipes/:id/reject   (flips isPublic=false; soft-delete)
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Recipe } from '@dishday/types';
import { getApi } from '@/lib/api';

export interface RecipeReviewSheetProps {
  /** Recipe id; null closes the sheet. */
  recipeId: string | null;
  onClose: () => void;
  /** Optional callback fired after a successful approve/reject. */
  onDecision?: () => void;
}

export function RecipeReviewSheet({ recipeId, onClose, onDecision }: RecipeReviewSheetProps) {
  const api = getApi();
  const qc = useQueryClient();

  const recipeQ = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => api.recipes.get(recipeId!),
    enabled: !!recipeId,
  });

  const approve = useMutation({
    mutationFn: () => api.admin.approveRecipe(recipeId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-recipes'] });
      onDecision?.();
      onClose();
    },
  });

  const reject = useMutation({
    mutationFn: () => api.admin.rejectRecipe(recipeId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-recipes'] });
      onDecision?.();
      onClose();
    },
  });

  if (!recipeId) return null;

  return (
    <>
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />

      {/* Sheet */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Recipe review</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {recipeQ.isLoading && <Skeleton />}
          {recipeQ.error && (
            <p className="text-sm text-rose-600">Failed to load recipe.</p>
          )}
          {recipeQ.data && <RecipeBody recipe={recipeQ.data} />}
        </div>

        <footer className="flex gap-2 border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={() => reject.mutate()}
            disabled={reject.isPending || !recipeQ.data}
            className="flex-1 rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            {reject.isPending ? 'Rejecting…' : 'Reject'}
          </button>
          <button
            type="button"
            onClick={() => approve.mutate()}
            disabled={approve.isPending || !recipeQ.data}
            className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {approve.isPending ? 'Approving…' : 'Approve'}
          </button>
        </footer>
      </aside>
    </>
  );
}

function RecipeBody({ recipe }: { recipe: Recipe }) {
  return (
    <div className="space-y-4">
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}

      <div>
        <h3 className="text-xl font-bold">{recipe.title}</h3>
        {recipe.description && (
          <p className="mt-1 text-sm text-zinc-700">{recipe.description}</p>
        )}
      </div>

      <Meta recipe={recipe} />

      {!!recipe.tags?.length && (
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {!!recipe.ingredients?.length && (
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Ingredients
          </h4>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex justify-between border-b border-zinc-100 py-1">
                <span>{ing.name}</span>
                <span className="tabular-nums text-zinc-600">
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Meta({ recipe }: { recipe: Recipe }) {
  const rows: [string, string | number | null][] = [
    ['Source', recipe.source],
    ['Servings', recipe.servings],
    ['Prep time', recipe.prepTimeMin !== null ? `${recipe.prepTimeMin} min` : null],
    ['Cook time', recipe.cookTimeMin !== null ? `${recipe.cookTimeMin} min` : null],
    ['Cuisine', recipe.cuisine],
    ['Meal types', recipe.mealType.join(', ') || null],
    ['Author', recipe.authorId ? recipe.authorId.slice(0, 8) + '…' : null],
    ['Created', new Date(recipe.createdAt).toLocaleString()],
    ['Public', recipe.isPublic ? 'yes' : 'no'],
    ['Approved', recipe.isApproved ? 'yes' : 'no'],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
      {rows
        .filter(([, v]) => v !== null && v !== '')
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="font-medium text-zinc-900">{String(value)}</dd>
          </div>
        ))}
    </dl>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-40 animate-pulse rounded bg-zinc-200" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
      <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}
