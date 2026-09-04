import type { User } from "@supabase/supabase-js";

/** Visningsnamn från Google-kontot (full_name > name > e-post). */
export function displayNameFromUser(user: User | null): string {
  if (!user) return "Spelare";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof meta.full_name === "string" ? meta.full_name : "";
  const name = typeof meta.name === "string" ? meta.name : "";
  return fullName || name || user.email || "Spelare";
}

/** Format millisekunder som "12,4 s". */
export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Format sekunder som m:ss. */
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}`;
}

export function winRate(wins: number, losses: number, draws: number): number {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Extraherar ett läsbart meddelande ur fel av olika former.
 * Supabase PostgrestError är ett vanligt objekt (inte instanceof Error),
 * så `e instanceof Error ? e.message : fallback` gömmer det riktiga felet.
 */
export function errorMessage(e: unknown, fallback: string): string {
  let message: string | null = null;
  if (e instanceof Error) {
    message = e.message;
  } else if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") message = m;
  } else if (typeof e === "string") {
    message = e;
  }
  if (!message || !message.trim()) return fallback;

  // "... in the schema cache" = tabellen/funktionen saknas i databasen.
  if (/schema cache/i.test(message)) {
    return "Duell-databasen är inte installerad ännu. Kör migreringsfilen supabase/migrations/0002_duel_pvp.sql i Supabase Dashboard → SQL Editor.";
  }
  return message;
}
