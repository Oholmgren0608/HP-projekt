import type { Database } from "@/lib/supabase/client";

export type DuelMode = "ranked" | "casual" | "private";

export type DuelMatch = Database["public"]["Tables"]["duel_matches"]["Row"];
export type DuelProfile = Database["public"]["Tables"]["player_profiles"]["Row"];
export type DuelAnswer = Database["public"]["Tables"]["duel_answers"]["Row"];

/** Frågeformatet som dueller använder (samma som övningsbanken). */
export const DUEL_QUESTION_COUNT = 10;
export const DUEL_SECONDS_PER_QUESTION = 20;
export const DUEL_MATCHMAKING_TIMEOUT_MS = 20_000;
export const DUEL_STALL_GRACE_MS = 60_000;

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

export function duelStatusLabel(status: DuelMatch["status"]): string {
  switch (status) {
    case "waiting":
      return "Väntar";
    case "active":
      return "Pågår";
    case "finished":
      return "Avslutad";
    case "forfeit":
      return "Uppgiven";
    case "cancelled":
      return "Avbruten";
  }
}
