"use client";

import { getSupabase, requireSupabase } from "@/lib/supabase/client";
import { invalidateAvatar } from "./store";

async function token(): Promise<string> {
  const supabase = getSupabase();
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const t = data.session?.access_token;
  if (!t) throw new Error("Du måste vara inloggad.");
  return t;
}

export type UploadResult = { status: "approved" | "pending" } | { status: "rejected"; error: string };

/** Laddar upp en ny profilbild. Servern kontrollerar den innan den syns. */
export async function uploadAvatar(file: Blob, userId: string): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file, "profilbild");
  const res = await fetch("/api/profilbild", {
    method: "POST",
    headers: { authorization: `Bearer ${await token()}` },
    body: form,
  });
  const body = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
  if (res.status === 422) return { status: "rejected", error: body.error ?? "Bilden godkändes inte." };
  if (!res.ok) throw new Error(body.error ?? "Bilden kunde inte laddas upp.");
  invalidateAvatar(userId);
  return { status: body.status === "pending" ? "pending" : "approved" };
}

export async function removeAvatar(userId: string): Promise<void> {
  const res = await fetch("/api/profilbild", {
    method: "DELETE",
    headers: { authorization: `Bearer ${await token()}` },
  });
  if (!res.ok) throw new Error("Bilden kunde inte tas bort.");
  invalidateAvatar(userId);
}

/** Min egen rad (även väntande eller dold bild), för profilsidan. */
export async function fetchMyAvatar(userId: string) {
  const { data, error } = await requireSupabase()
    .from("user_avatars")
    .select("path, status, reason")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function reportAvatar(userId: string, reason: string) {
  const { data, error } = await requireSupabase().rpc("avatar_report", { p_user_id: userId, p_reason: reason });
  if (error) throw error;
  return data;
}
