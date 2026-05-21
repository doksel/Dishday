'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Recipe } from '@dishday/types';
import { DataTable } from '@/components/DataTable';

const DEMO: Pick<Recipe, 'id' | 'title' | 'source' | 'isApproved' | 'createdAt'>[] = [
  { id: '1', title: 'Margherita Pizza', source: 'official', isApproved: true, createdAt: '2026-04-01T00:00:00Z' },
  { id: '2', title: 'Quinoa Bowl', source: 'user', isApproved: false, createdAt: '2026-05-10T00:00:00Z' },
];

const columns: ColumnDef<(typeof DEMO)[0]>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'source', header: 'Source' },
  {
    accessorKey: 'isApproved',
    header: 'Status',
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Approved</span>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending</span>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];

export default function AdminRecipesPage() {
  return (
    <main className="px-8 py-10">
      <h1 className="text-2xl font-bold">Recipe moderation</h1>
      <p className="mt-1 text-sm text-zinc-600">User-submitted recipes awaiting approval.</p>
      <div className="mt-6">
        <DataTable data={DEMO} columns={columns} />
      </div>
    </main>
  );
}
