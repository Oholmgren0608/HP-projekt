import type { User } from "@supabase/supabase-js";

import type { DuelMatch } from "@/lib/duel/types";

export type DuelResult = "win" | "loss" | "draw";

/**
 * Klassificerar en avslutad duells utfall för spelaren `meId`. Delas av
 * XP-rapporteringen (engine) och resultatvyn så att de aldrig kan divergera.
 *
 * Botmatcher: servern (duel_finish_bot) sätter winner = null både vid förlust
 * (boten vann, b_correct > a_correct) och vid oavgjort; skillnaden syns bara i
 * a_correct/b_correct. Uppgivande registrerar alltid en förlust. (G21)
 */
export function classifyDuelResult(match: DuelMatch, meId: string): DuelResult {
  if (match.winner === meId) return "win";
  if (match.status === "forfeit") return "loss";

  const isBotMatch = match.player_b === null && match.bot_elo != null;
  if (isBotMatch && match.status === "finished" && match.winner === null) {
    return match.b_correct != null &&
      match.a_correct != null &&
      match.b_correct === match.a_correct
      ? "draw"
      : "loss";
  }

  return match.winner === null ? "draw" : "loss";
}


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
