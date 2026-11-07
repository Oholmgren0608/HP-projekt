import { requireSupabase } from "@/lib/supabase/client";
import type { DuelMode } from "./types";

/**
 * Tunna wrappers runt SECURITY DEFINER-RPC:erna. All rankinglogik sker i
 * databasen; klienten anropar bara funktionerna och hanterar resultatet.
 */

/** Returnerar match-id om matchad direkt, annars null (du står i kö). */
export async function joinQueue(mode: DuelMode): Promise<string | null> {
  const { data, error } = await requireSupabase().rpc("duel_join_queue", { p_mode: mode });
  if (error) throw error;
  return data;
}

export async function cancelQueue(): Promise<void> {
  const { error } = await requireSupabase().rpc("duel_cancel_queue", {});
  if (error) throw error;
}

export async function startBotMatch(mode: DuelMode): Promise<string> {
  const { data, error } = await requireSupabase().rpc("duel_start_bot_match", {
    p_mode: mode,
  });
  if (error) throw error;
  return data as string;
}

/** Returnerar match-id om matchen finaliserades, annars null (vänta på motståndare). */
export async function markFinished(matchId: string): Promise<string | null> {
  const { data, error } = await requireSupabase().rpc("duel_mark_finished", {
    p_match_id: matchId,
  });
  if (error) throw error;
  return data;
}

/** Avgör botmatchen på servern; botens svar räknas ut där (0037). */
export async function finishBot(matchId: string): Promise<{
  delta: number;
  winner_is_me: boolean;
  bot_correct: number;
  my_correct: number;
} | null> {
  const { data, error } = await requireSupabase().rpc("duel_finish_bot", {
    p_match_id: matchId,
  });
  if (error) throw error;
  return data;
}

export async function forfeit(matchId: string): Promise<void> {
  const { error } = await requireSupabase().rpc("duel_forfeit", { p_match_id: matchId });
  if (error) throw error;
}

export async function claimStallWin(matchId: string): Promise<void> {
  const { error } = await requireSupabase().rpc("duel_claim_stall_win", {
    p_match_id: matchId,
  });
  if (error) throw error;
}

export async function createPrivate(): Promise<{
  code: string;
  match_id: string;
}> {
  const { data, error } = await requireSupabase().rpc("duel_create_private", {});
  if (error) throw error;
  return data as { code: string; match_id: string };
}

export async function joinPrivate(code: string): Promise<string | null> {
  const { data, error } = await requireSupabase().rpc("duel_join_private", {
    p_code: code,
  });
  if (error) throw error;
  return data;
}

export async function cancelPrivate(matchId: string): Promise<void> {
  const { error } = await requireSupabase().rpc("duel_cancel_private", {
    p_match_id: matchId,
  });
  if (error) throw error;
}
