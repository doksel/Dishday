/**
 * Typed Dishday API client for the admin app.
 *
 *   Same shape as the mobile / web wrappers (see `apps/mobile/src/lib/api.ts`).
 *   Every request pulls the current Supabase access token from the browser
 *   client and sends it as `Authorization: Bearer ...`. Admin-only routes on
 *   the backend additionally check `user.plan === 'admin'`; the Next.js
 *   middleware enforces the same at the route level.
 */

'use client';

import { ApiClient, createDishdayApi, type DishdayApi } from '@dishday/api-client';
import { createClient } from './supabase/client';

let cached: DishdayApi | null = null;

export function getApi(): DishdayApi {
  if (cached) return cached;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
  const supabase = createClient();

  const client = new ApiClient({
    baseUrl,
    getAccessToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });

  cached = createDishdayApi(client);
  return cached;
}
