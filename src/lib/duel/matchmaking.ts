import { getSupabase } from "@/lib/supabase/client";
import type { DuelMode } from "./types";

/**
 * Tunna wrappers runt SECURITY DEFINER-RPC:erna. All rankinglogik sker i
 * databasen; klienten anropar bara funktionerna och hanterar resultatet.
 */

function rpc() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase är inte konfigurerat");
  return client;
}

/** Returnerar match-id om matchad direkt, annars null (du står i kö). */
export async function joinQueue(mode: DuelMode): Promise<string | null> {
  const { data, error } = await rpc().rpc("duel_join_queue", { p_mode: mode });
  if (error) throw error;
  return data;
}

export async function cancelQueue(): Promise<void> {
  const { error } = await rpc().rpc("duel_cancel_queue", {});
  if (error) throw error;
}

export async function startBotMatch(mode: DuelMode): Promise<string> {
  const { data, error } = await rpc().rpc("duel_start_bot_match", {
    p_mode: mode,
  });
  if (error) throw error;
  return data as string;
}

export async function submitAnswer(args: {
  matchId: string;
  questionId: string;
  chosen: number;
  correct: boolean;
  timeMs: number;
}): Promise<void> {
  const { error } = await rpc().rpc("duel_submit_answer", {
    p_match_id: args.matchId,
    p_question_id: args.questionId,
    p_chosen: args.chosen,
    p_correct: args.correct,
    p_time_ms: args.timeMs,
  });
  if (error) throw error;
}

/** Returnerar match-id om matchen finaliserades, annars null (vänta på motståndare). */
export async function markFinished(
  matchId: string,
  correct: number,
  timeMs: number,
): Promise<string | null> {
  const { data, error } = await rpc().rpc("duel_mark_finished", {
    p_match_id: matchId,
    p_correct: correct,
    p_time_ms: timeMs,
  });
  if (error) throw error;
  return data;
}

export async function finishBot(args: {
  matchId: string;
  playerCorrect: number;
  playerTimeMs: number;
  botCorrect: number;
}): Promise<{ delta: number; winner_is_me: boolean } | null> {
  const { data, error } = await rpc().rpc("duel_finish_bot", {
    p_match_id: args.matchId,
    p_player_correct: args.playerCorrect,
    p_player_time_ms: args.playerTimeMs,
    p_bot_correct: args.botCorrect,
  });
  if (error) throw error;
  return data;
}

export async function forfeit(matchId: string): Promise<void> {
  const { error } = await rpc().rpc("duel_forfeit", { p_match_id: matchId });
  if (error) throw error;
}

export async function claimStallWin(matchId: string): Promise<void> {
  const { error } = await rpc().rpc("duel_claim_stall_win", {
    p_match_id: matchId,
  });
  if (error) throw error;
}

export async function createPrivate(): Promise<{
  code: string;
  match_id: string;
}> {
  const { data, error } = await rpc().rpc("duel_create_private", {});
  if (error) throw error;
  return data as { code: string; match_id: string };
}

export async function joinPrivate(code: string): Promise<string | null> {
  const { data, error } = await rpc().rpc("duel_join_private", {
    p_code: code,
  });
  if (error) throw error;
  return data;
}

export async function cancelPrivate(matchId: string): Promise<void> {
  const { error } = await rpc().rpc("duel_cancel_private", {
    p_match_id: matchId,
  });
  if (error) throw error;
}
