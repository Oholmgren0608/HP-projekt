import { requireSupabase, type AmaState } from "@/lib/supabase/client";

/**
 * Alla mot alla mot servern (migration 0038). Servern äger takten, rättningen
 * och poängen; klienten skickar svar och läser läget med `ama_state`. Facit
 * finns bara i läget under reveal och när spelet är slut.
 */

export async function createRoom(kinds: string[], extended: boolean) {
  const { data, error } = await requireSupabase().rpc("ama_create_private", {
    p_kinds: kinds,
    p_extended: extended,
  });
  if (error) throw error;
  return data;
}

export async function joinRoom(code: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc("ama_join_private", { p_code: code.trim() });
  if (error) throw error;
  return data;
}

export async function findMatch(): Promise<string> {
  const { data, error } = await requireSupabase().rpc("ama_find_match", {});
  if (error) throw error;
  return data;
}

export async function updateSettings(gameId: string, kinds: string[], extended: boolean) {
  const { error } = await requireSupabase().rpc("ama_update_settings", {
    p_game_id: gameId,
    p_kinds: kinds,
    p_extended: extended,
  });
  if (error) throw error;
}

export async function startGame(gameId: string) {
  const { error } = await requireSupabase().rpc("ama_start", { p_game_id: gameId });
  if (error) throw error;
}

export async function leaveGame(gameId: string) {
  const { error } = await requireSupabase().rpc("ama_leave", { p_game_id: gameId });
  if (error) throw error;
}

/** `chosen` null = tiden tog slut. */
export async function submitAnswer(gameId: string, index: number, chosen: number | null) {
  const { data, error } = await requireSupabase().rpc("ama_submit", {
    p_game_id: gameId,
    p_idx: index,
    p_chosen: chosen ?? -1,
  });
  if (error) throw error;
  return data;
}

export async function fetchState(gameId: string): Promise<AmaState> {
  const { data, error } = await requireSupabase().rpc("ama_state", { p_game_id: gameId });
  if (error) throw error;
  return data;
}
