'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@dishday/types';
import { DataTable } from '@/components/DataTable';

// Demo data — wire to GET /admin/users when implemented.
const DEMO: User[] = [
  {
    id: 'demo-1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    avatarUrl: null,
    plan: 'pro',
    planExpiresAt: '2026-12-31T00:00:00Z',
    onboardingDone: true,
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
  },
];

const columns: ColumnDef<User>[] = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ getValue }) => {
      const plan = getValue<string>();
      const color =
        plan === 'pro' ? 'bg-emerald-100 text-emerald-700' :
        plan === 'admin' ? 'bg-purple-100 text-purple-700' :
        'bg-zinc-100 text-zinc-700';
      return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{plan}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];

export default function UsersPage() {
  return (
    <main className="px-8 py-10">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-zinc-600">Search, filter, ban, change plan.</p>
      <div className="mt-6">
        <DataTable data={DEMO} columns={columns} />
      </div>
    </main>
  );
}
