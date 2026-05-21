import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Server-side admin client — uses service role key. NEVER expose to clients. */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

/** Create a per-request client that forwards the user's JWT (for RLS). */
export function supabaseFor(userJwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
}
