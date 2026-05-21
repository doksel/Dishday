'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@dishday/ui';

// Demo timeseries — wire to GET /admin/ai-logs when implemented.
const DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  costUsd: 2 + Math.random() * 12 + (i > 20 ? i / 4 : 0),
  tokens: 50_000 + Math.floor(Math.random() * 200_000),
}));

export default function AiCostPage() {
  const total = DATA.reduce((acc, d) => acc + d.costUsd, 0);
  const tokensTotal = DATA.reduce((acc, d) => acc + d.tokens, 0);

  return (
    <main className="px-8 py-10">
      <h1 className="text-2xl font-bold">AI usage</h1>
      <p className="mt-1 text-sm text-zinc-600">Daily Claude cost across all users.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-zinc-500">30-day spend</div>
          <div className="mt-1 text-2xl font-semibold">${total.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500">Tokens consumed</div>
          <div className="mt-1 text-2xl font-semibold">{(tokensTotal / 1_000_000).toFixed(2)}M</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500">Avg per request</div>
          <div className="mt-1 text-2xl font-semibold">$0.12</div>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="text-sm font-semibold text-zinc-700">Daily cost (USD)</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="costUsd" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </main>
  );
}
