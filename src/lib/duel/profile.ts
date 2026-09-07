import { requireSupabase } from "@/lib/supabase/client";
import type { DuelMatch, DuelProfile } from "./types";

/** Offentlig profilvy — det enda andra spelare får se om varandra. */
export type PublicDuelProfile = {
  user_id: string;
  display_name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
};

/** PvP kräver Supabase + inloggning. Kasta om det saknas. */
export async function ensureProfile(userId: string, displayName: string) {
  const { error } = await requireSupabase().rpc("duel_ensure_profile", {
    p_display_name: displayName,
  });
  if (error) console.warn("[duel] ensure_profile:", error.message);
}

export async function getMyProfile(userId: string): Promise<DuelProfile | null> {
  const { data, error } = await requireSupabase()
    .from("player_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPublicProfile(
  userId: string,
): Promise<PublicDuelProfile | null> {
  const { data, error } = await requireSupabase()
    .from("duel_public_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLeaderboard(limit = 50): Promise<PublicDuelProfile[]> {
  const { data, error } = await requireSupabase()
    .from("duel_public_profiles")
    .select("*")
    .order("elo", { ascending: false })
    .order("wins", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getMatchHistory(
  userId: string,
  limit = 30,
): Promise<DuelMatch[]> {
  const { data, error } = await requireSupabase()
    .from("duel_matches")
    .select("*")
    // userId är en uuid härifrån (från auth), så stränginterpolering är säker.
    .or(`player_a.eq.${userId},player_b.eq.${userId}`)
    .in("status", ["finished", "forfeit"])
    .order("finished_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
