'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Admin sign-in screen.
 *
 *   The Next.js middleware redirects unauthenticated visitors here (and
 *   non-admin users with `?error=forbidden`). On success we navigate back to
 *   `/`, which the middleware re-checks — admin users pass through, others
 *   bounce back here with the forbidden error visible.
 *
 *   This page is rendered OUTSIDE the sidebar shell in the root layout: the
 *   layout has no `(auth)` group, but since the form lives at /login and the
 *   sidebar links don't point to /login, the sidebar's presence here is
 *   harmless — we just hide nothing. Keep the form centered and self-contained
 *   so the visual impact is minimal.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Middleware appends ?error=forbidden when a non-admin user tries to view
  // a protected page. Surface that as a clear hint before they try logging in
  // again with the same account.
  const forbidden = search.get('error') === 'forbidden';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    // Middleware re-checks plan === 'admin' on the next navigation; if the
    // current account is not admin, it will bounce back here with ?error=forbidden.
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Dishday Admin</h1>
          <p className="mt-1 text-sm text-zinc-600">Sign in to continue</p>
        </div>

        {forbidden && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            This account doesn&apos;t have admin access. Sign in with an admin user.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Need an account? Create one via Supabase Dashboard → Authentication.
        </p>
      </div>
    </main>
  );
}
