"use server";

import { createAdminClient, verifyUser } from "@/lib/supabase/server";

const EXPERT_BUCKET = "expert-documents";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Raderar den inloggade användarens konto (inkl. alla relaterade rader).
 *
 * Alla user_id-främmandenycklar i public-schemat (user_state,
 * player_profiles, duel_matches.player_a/player_b, duel_answers,
 * duel_queue, duel_reviews.reviewer_id/target_user) har redan
 * ON DELETE CASCADE mot auth.users, så `auth.admin.deleteUser` räcker för
 * databasen. Filer i Storage (expertansökningarnas underlag) raderas först.
 */
export async function deleteAccount(
  accessToken: string,
): Promise<DeleteAccountResult> {
  const userId = await verifyUser(accessToken);
  if (!userId) return { ok: false, error: "NOT_AUTHENTICATED" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "NOT_CONFIGURED" };

  // Expertansökningarnas underlag ligger i Storage, som inte följer med när
  // raderna i databasen raderas. Ta bort filerna först: både de som har en rad
  // och allt annat under användarens mapp.
  const { data: documents, error: listError } = await admin
    .from("expert_documents")
    .select("storage_path")
    .eq("user_id", userId);
  // Saknas tabellen (före migration 0029) finns inga rader att utgå från.
  if (listError && !["PGRST205", "42P01"].includes(listError.code ?? "")) {
    return { ok: false, error: listError.message };
  }
  const paths = new Set((documents ?? []).map((d) => d.storage_path));
  const top = await admin.storage.from(EXPERT_BUCKET).list(userId, { limit: 1000 });
  for (const entry of top.data ?? []) {
    if (entry.id) {
      paths.add(`${userId}/${entry.name}`);
      continue;
    }
    const inner = await admin.storage.from(EXPERT_BUCKET).list(`${userId}/${entry.name}`, { limit: 1000 });
    for (const file of inner.data ?? []) if (file.id) paths.add(`${userId}/${entry.name}/${file.name}`);
  }
  if (paths.size > 0) {
    const removed = await admin.storage.from(EXPERT_BUCKET).remove([...paths]);
    if (removed.error) return { ok: false, error: removed.error.message };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
