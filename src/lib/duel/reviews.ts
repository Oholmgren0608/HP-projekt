import { getSupabase } from "@/lib/supabase/client";
import type { DuelReview } from "./types";

/**
 * Recensioner/rapporter efter avslutad duell. All validering, viktning och
 * flaggning sker i SECURITY DEFINER-RPC:n duel_submit_review i databasen.
 */

export type ReportReason = "cheating" | "unsportsmanlike" | "abuse" | "other";
export type BotDifficulty = "too_easy" | "just_right" | "too_hard";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  cheating: "Fusk",
  unsportsmanlike: "Osportsligt",
  abuse: "Missbruk av funktioner",
  other: "Annat",
};

function rpc() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase är inte konfigurerat");
  return client;
}

export async function submitReview(args: {
  matchId: string;
  /** 1-5 mot människa, null mot bot. */
  rating: number | null;
  /** Svårighetsröst mot bot, null mot människa. */
  difficulty: BotDifficulty | null;
  /** Rapportorsak mot människa, null = ingen rapport. */
  reportReason: ReportReason | null;
  comment: string;
}): Promise<void> {
  const { error } = await rpc().rpc("duel_submit_review", {
    p_match_id: args.matchId,
    p_rating: args.rating,
    p_difficulty: args.difficulty,
    p_report_reason: args.reportReason,
    p_comment: args.comment,
  });
  if (error) throw error;
}

/** Min eventuella tidigare recension av matchen (en per match). */
export async function getMyReview(matchId: string): Promise<DuelReview | null> {
  const client = rpc();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from("duel_reviews")
    .select("*")
    .eq("match_id", matchId);
  if (error) throw error;

  const mine = (data ?? []).find((r) => r.reviewer_id === user.id);
  return mine ?? null;
}
