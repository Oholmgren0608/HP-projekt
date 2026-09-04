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
