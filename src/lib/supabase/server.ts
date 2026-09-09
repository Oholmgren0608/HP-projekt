import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./client";

/**
 * Server-side Supabase-access. Importas ALDRIG från en klientkomponent
 * (guard: `import "server-only"` kastar vid build om filen når browsern).
 *
 * Alla skrivningar mot public.questions / public.exams går via en admin-client
 * med SUPABASE_SERVICE_ROLE_KEY — RLS har inga write-policies för klientroller.
 */

export type AdminClient = ReturnType<typeof createClient<Database>>;

/** Server-URL (samma projekt som NEXT_PUBLIC_SUPABASE_URL, men ej exponerad). */
function serverUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
}

/** Komma-separerad allowlist, normaliserad till gemener. */
export function getReviewAllowedEmails(): string[] {
  return (process.env.REVIEW_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Sant när server-nycklarna och allowlisten finns (review går att använda). */
export function isReviewConfigured(): boolean {
  return Boolean(
    serverUrl() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      getReviewAllowedEmails().length > 0,
  );
}

/**
 * Admin-client med service-role-nyckeln, eller null om env saknas.
 * Service-role-nyckeln får aldrig hamna i browsern — den här filen är
 * server-only och `process.env.SUPABASE_SERVICE_ROLE_KEY` är inte NEXT_PUBLIC_.
 */
export function createAdminClient(): AdminClient | null {
  const url = serverUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verifierar en browser-utfärdad Supabase access-token och kontrollerar att
 * användarens e-post finns i REVIEW_ALLOWED_EMAILS. Returnerar e-posten
 * (gemener) eller null. Används som guard i varje server action.
 */
export async function verifyReviewer(
  accessToken: string,
): Promise<string | null> {
  if (!accessToken) return null;

  const url = serverUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    const email = (data.user.email ?? "").trim().toLowerCase();
    if (!email) return null;
    return getReviewAllowedEmails().includes(email) ? email : null;
  } catch {
    return null;
  }
}

/**
 * Verifierar en browser-utfärdad Supabase access-token UTAN e-post-allowlist.
 * Returnerar användarens id (uuid) eller null. Används för åtgärder där en
 * inloggad användare får agera på sitt eget konto (t.ex. radera kontot).
 */
export async function verifyUser(accessToken: string): Promise<string | null> {
  if (!accessToken) return null;

  const url = serverUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
