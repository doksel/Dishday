import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

/**
 * Recipes index — placeholder until the new design lands.
 *
 *   The previous prototype (search + grid that called `/v1/recipes`) is left
 *   in git history; we'll rebuild this screen with the same AppShell pattern
 *   as Home once the design hits.
 */
export default function RecipesPage() {
  return (
    <AppShell title="Recipes" subtitle="Browse the catalog">
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          The recipe browser is being redesigned. While we&apos;re finalising the layout, this
          page is intentionally empty.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
