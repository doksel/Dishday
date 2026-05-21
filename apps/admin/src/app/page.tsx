import { Card } from '@dishday/ui';

export default function AdminDashboard() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Dishday Admin</h1>
      <p className="mt-1 text-zinc-600">KPIs, moderation, AI usage.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-zinc-500">Daily active users</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500">MRR</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500">AI cost (month)</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
        </Card>
      </div>
    </main>
  );
}
