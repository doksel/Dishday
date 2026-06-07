import { ApiClient, createDishdayApi, type DishdayApi } from '@dishday/api-client';
import { supabase } from './supabase';

let cached: DishdayApi | null = null;

/**
 * Returns the typed Dishday API client. Every request automatically
 * pulls the current Supabase access token and sends it as a Bearer.
 * After sign-out subsequent calls will 401.
 */
export function getApi(): DishdayApi {
  if (cached) return cached;

  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

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
