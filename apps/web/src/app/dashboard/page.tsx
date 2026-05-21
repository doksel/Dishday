import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@dishday/ui';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Hi, {data.user.user_metadata?.name ?? data.user.email}</h1>
      <p className="mt-1 text-zinc-600">What's on your plate this week?</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/planner">
          <Card className="h-full transition hover:shadow-md">
            <div className="text-sm text-zinc-500">This week</div>
            <div className="mt-1 text-xl font-semibold">Open meal planner</div>
            <div className="mt-2 text-sm text-zinc-600">Plan 7 days × 4 meals.</div>
          </Card>
        </Link>
        <Link href="/recipes">
          <Card className="h-full transition hover:shadow-md">
            <div className="text-sm text-zinc-500">Library</div>
            <div className="mt-1 text-xl font-semibold">Browse recipes</div>
            <div className="mt-2 text-sm text-zinc-600">Filter by cuisine, diet, prep time.</div>
          </Card>
        </Link>
        <Link href="/shopping">
          <Card className="h-full transition hover:shadow-md">
            <div className="text-sm text-zinc-500">Groceries</div>
            <div className="mt-1 text-xl font-semibold">Shopping list</div>
            <div className="mt-2 text-sm text-zinc-600">Consolidated from this week.</div>
          </Card>
        </Link>
      </div>
    </main>
  );
}
