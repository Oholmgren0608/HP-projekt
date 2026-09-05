/**
 * Topplistan (Supabase): skicka in veckans XP, hämta listan och ändra
 * visningsnamn. Allt no-opar tyst när Supabase saknas eller användaren
 * inte är inloggad — appen fungerar fullt ut anonymt.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  xp: number;
  is_me: boolean;
};

export async function submitWeeklyXp(week: string, xp: number): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc("leaderboard_submit", {
      p_week: week,
      p_xp: Math.max(0, Math.round(xp)),
    });
    if (error) console.warn("[topplista] kunde inte skicka XP:", error.message);
  } catch (e) {
    console.warn("[topplista] nätverksfel vid XP-inlämning:", e);
  }
}

export async function fetchLeaderboard(week: string, limit = 50): Promise<LeaderboardRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("leaderboard_get", {
      p_week: week,
      p_limit: limit,
    });
    if (error) {
      console.warn("[topplista] kunde inte hämta listan:", error.message);
      return [];
    }
    return (data ?? []) as LeaderboardRow[];
  } catch (e) {
    console.warn("[topplista] nätverksfel vid hämtning:", e);
    return [];
  }
}

export async function setDisplayName(name: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc("leaderboard_set_name", {
      p_display_name: name,
    });
    if (error) console.warn("[topplista] kunde inte ändra namn:", error.message);
  } catch (e) {
    console.warn("[topplista] nätverksfel vid namnbyte:", e);
  }
}

export function supabaseAvailable(): boolean {
  return isSupabaseConfigured();
}
