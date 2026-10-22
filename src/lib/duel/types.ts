import type { Database } from "@/lib/supabase/client";

export type DuelMode = "ranked" | "casual" | "private";

export type DuelMatch = Database["public"]["Tables"]["duel_matches"]["Row"];
export type DuelProfile = Database["public"]["Tables"]["player_profiles"]["Row"];
export type DuelAnswer = Database["public"]["Tables"]["duel_answers"]["Row"];
export type DuelReview = Database["public"]["Tables"]["duel_reviews"]["Row"];

/** Frågeformatet som dueller använder (samma som övningsbanken). */
export const DUEL_QUESTION_COUNT = 10;
export const DUEL_SECONDS_PER_QUESTION = 20;
export const DUEL_MATCHMAKING_TIMEOUT_MS = 20_000;
export const DUEL_STALL_GRACE_MS = 60_000;
/** Tidigast så länge efter matchstart godtar servern anspråk på vinst (10 x 20 s + marginal). */
export const DUEL_STALL_MATCH_WINDOW_MS = 5 * 60_000;

export function duelModeLabel(mode: DuelMode): string {
  switch (mode) {
    case "ranked":
      return "Ranked";
    case "casual":
      return "Casual";
    case "private":
      return "Privat";
  }
}
