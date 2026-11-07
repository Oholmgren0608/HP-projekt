"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSupabase, SUPABASE_URL } from "@/lib/supabase/client";

/**
 * Godkända profilbilder (vyn public_avatars, 0039), hämtade i klump och
 * cachade i minnet. `null` = användaren har ingen godkänd bild (visa initialer).
 */

const cache = new Map<string, string | null>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function avatarUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

async function flush() {
  timer = null;
  const ids = [...pending];
  pending.clear();
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error } = await supabase.from("public_avatars").select("user_id, path").in("user_id", chunk);
    if (error) continue;
    const found = new Map((data ?? []).map((r) => [r.user_id, r.path]));
    for (const id of chunk) cache.set(id, found.get(id) ?? null);
  }
  emit();
}

function request(ids: string[]) {
  let added = false;
  for (const id of ids) {
    if (!id || cache.has(id) || pending.has(id)) continue;
    pending.add(id);
    added = true;
  }
  if (added && !timer) timer = setTimeout(() => void flush(), 30);
}

/** Sätter en känd bild direkt (t.ex. Alla mot alla, som får sökvägarna från servern). */
export function primeAvatars(entries: [string, string | null][]) {
  for (const [id, path] of entries) cache.set(id, path);
  emit();
}

/** Glömmer en användares bild, t.ex. efter att den egna bilden bytts. */
export function invalidateAvatar(userId: string) {
  cache.delete(userId);
  request([userId]);
}

/** Bildens URL för en användare, eller null (inga bild / inte hämtad än). */
export function useAvatarUrl(userId: string | null | undefined): string | null {
  useSyncExternalStore(subscribe, () => version, () => 0);
  useEffect(() => {
    if (userId) request([userId]);
  }, [userId]);
  const path = userId ? cache.get(userId) : null;
  return path ? avatarUrl(path) : null;
}
