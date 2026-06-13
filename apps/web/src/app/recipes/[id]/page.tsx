import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

interface RecipeDetailParams {
  params: Promise<{ id: string }>;
}

/**
 * Recipe details — placeholder until the new design lands.
 *
 *   Renders inside AppShell so navigation works while we wait for the
 *   detail layout. The `id` is consumed from the route segment so the URL
 *   bar reflects the requested recipe; the value is just echoed back as
 *   a hint for now.
 */
export default async function RecipeDetailPage({ params }: RecipeDetailParams) {
  const { id } = await params;

  return (
    <AppShell title="Recipe" subtitle={`#${id}`}>
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Recipe detail page is being designed. Once we have the layout we&apos;ll wire it up to{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">GET /v1/recipes/{id}</code>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/recipes"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            All Recipes
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
