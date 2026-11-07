"use server";

import { createAdminClient, createUserClient, verifyUser } from "@/lib/supabase/server";

export type AvatarDecisionResult = { ok: true } | { ok: false; error: string };

/**
 * Teamets beslut om en profilbild. Rollkontrollen görs i databasen
 * (avatar_review kräver admin eller moderator och skriver revisionsloggen);
 * först därefter tar servern bort en underkänd bild ur bucketen.
 */
export async function decideAvatar(input: {
  accessToken: string;
  userId: string;
  decision: "approve" | "reject";
}): Promise<AvatarDecisionResult> {
  if (input.decision !== "approve" && input.decision !== "reject") return { ok: false, error: "Okänt beslut." };
  const actor = await verifyUser(input.accessToken);
  if (!actor) return { ok: false, error: "Du måste vara inloggad." };
  const asUser = createUserClient(input.accessToken);
  if (!asUser) return { ok: false, error: "Inte konfigurerat." };
  const { data: path, error } = await asUser.rpc("avatar_review", {
    p_user_id: input.userId,
    p_decision: input.decision,
  });
  if (error) return { ok: false, error: error.message };
  if (input.decision === "reject" && path) {
    const admin = createAdminClient();
    await admin?.storage.from("avatars").remove([path]);
  }
  return { ok: true };
}
