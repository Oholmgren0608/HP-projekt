"use server";

import { createAdminClient, verifyUser } from "@/lib/supabase/server";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Raderar den inloggade användarens konto (inkl. alla relaterade rader).
 *
 * Alla user_id-främmandenycklar i public-schemat (user_state,
 * player_profiles, duel_matches.player_a/player_b, duel_answers,
 * duel_queue, duel_reviews.reviewer_id/target_user) har redan
 * ON DELETE CASCADE mot auth.users, så enbart `auth.admin.deleteUser`
 * räcker — databasen städar resten.
 */
export async function deleteAccount(
  accessToken: string,
): Promise<DeleteAccountResult> {
  const userId = await verifyUser(accessToken);
  if (!userId) return { ok: false, error: "NOT_AUTHENTICATED" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "NOT_CONFIGURED" };

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
