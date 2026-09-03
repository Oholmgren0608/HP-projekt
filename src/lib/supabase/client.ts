import { createClient } from "@supabase/supabase-js";

/**
 * Supabase browser client, created lazily on first use.
 *
 * The app must keep working 100% anonymously without Supabase configured
 * (optional login), so nothing here throws: callers check
 * `isSupabaseConfigured()` before using `getSupabase()`.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Supabase browser client, or `null` if env vars are
 * missing (auth/sync UI should then be hidden or disabled).
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Separate from app data keys in localStorage (the sync adapter
        // enumerates app storage keys and must not touch the session).
        storageKey: "hp-lift-auth",
      },
    });
  }
  return browserClient;
}
