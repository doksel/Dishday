'use client';

import { ApiClient, createDishdayApi, type DishdayApi } from '@dishday/api-client';
import { createClient } from './supabase/client';

let cached: DishdayApi | null = null;

/**
 * Browser-side Dishday API client. Reads the current Supabase session
 * to attach a Bearer token on every request — when the user logs out,
 * subsequent requests will be 401'd by the API.
 */
export function getApi(): DishdayApi {
  if (cached) return cached;
  const supabase = createClient();
  const client = new ApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    getAccessToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
  cached = createDishdayApi(client);
  return cached;
}
