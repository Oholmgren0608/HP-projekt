/**
 * Drop-in-ersättning för localStorage med Supabase-synk när användaren är
 * inloggad.
 *
 * - Utloggad: exakt samma beteende som localStorage (anonym läge).
 * - Inloggad: localStorage behålls som offline-cache, men molnet
 *   (user_state-tabellen) är källa till sanning. Vid inloggning mergas
 *   molnet med lokala data nyckel för nyckel — "nyaste vinner" (lokal
 *   skrivtid vs. molnets updated_at). Klockskew mellan enheter kan göra
 *   jämförelsen ungefärlig; molnets tid väger tyngst vid lika.
 *
 * API:et är synkront (samma former som localStorage) så att befintliga
 * anrop kan bytas rakt av. Molnskrivningar skickas asynkront och fel
 * sväljs med console.warn — appen får aldrig krascha p.g.a. nätverksfel.
 *
 * Känd begränsning: samtidig redigering i två flikar/enheter synkas inte
 * i realtid; sista skrivning per nyckel vinner vid nästa inloggning.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

const META_KEY = "hp-lift-sync-meta-v1";

/**
 * Alla appnycklar som synkas (speglar storage-nycklarna i de olika
 * modulerna). Medvetet en explicit lista: session-/auth-nycklar
 * ("hp-lift-auth", "sb-*") får aldrig synkas.
 */
export const SYNCED_KEYS = [
  "hp-lift-scores-v1",
  "hp-lift-scores-saved-v1",
  "hp-lift-history-v1",
  "hp-lift-srs-v1",
  "hp-lift-mastered-v1",
  "hp-lift-adapt-plan-v1",
  "hp-lift-nivatest-counts-v1",
  "hp-studieplan-progress-v2",
  "hp-studieplan-scores-v1",
  "hp-lift-locked-weeks-v1",
  "hp-flashcards-progress-v1",
  "hp-reading-done-v1",
] as const;

type CloudRow = {
  storage_key: string;
  value: { v?: string } | null;
  updated_at: string;
};

/** Molnet lagrar råa localStorage-strängar som {"v": "<sträng>"} (jsonb). */
function unwrap(value: { v?: string } | null): string | null {
  return value && typeof value.v === "string" ? value.v : null;
}

// ---- Modultillstånd -------------------------------------------------------

let activeUserId: string | null = null;
/** Spegel av molnets nycklar → råa strängar. Null = utloggad/ej laddad. */
let cloudCache: Map<string, string> | null = null;
let mergeUserId: string | null = null;

// ---- Lokal skrivtid -------------------------------------------------------

function readMeta(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function writeMeta(meta: Record<string, number>) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// ---- Molnskrivningar (async, fel sväljs) ----------------------------------

async function pushToCloud(userId: string, key: string, value: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: userId,
      storage_key: key,
      value: { v: value },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,storage_key" },
  );
  if (error) console.warn(`[sync] Kunde inte skriva "${key}" till molnet:`, error.message);
}

async function deleteFromCloud(userId: string, key: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_state")
    .delete()
    .eq("user_id", userId)
    .eq("storage_key", key);
  if (error) console.warn(`[sync] Kunde inte radera "${key}" i molnet:`, error.message);
}

// ---- Merge vid inloggning -------------------------------------------------

async function performMerge(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data, error } = await supabase
    .from("user_state")
    .select("storage_key, value, updated_at")
    .eq("user_id", userId);

  if (error) {
    console.warn("[sync] Kunde inte hämta molndata — fortsätter med lokal data:", error.message);
    return;
  }

  const meta = readMeta();
  const rows = (data ?? []) as CloudRow[];
  const rowByKey = new Map(rows.map((r) => [r.storage_key, r]));

  const uploads: Array<Promise<void>> = [];
  const cache = new Map<string, string>();
  // Sant om molnet faktiskt ändrade lokal data — dä krävs en reload så att
  // komponenternas in-memory-tillstånd återspeglar molnet.
  let adopted = false;

  for (const key of SYNCED_KEYS) {
    const row = rowByKey.get(key);
    const localValue = localStorage.getItem(key);
    const localAt = meta[key] ?? 0;

    if (row) {
      const cloudValue = unwrap(row.value);
      const cloudAt = new Date(row.updated_at).getTime();
      const cloudNewer = Number.isFinite(cloudAt) ? cloudAt >= localAt : true;

      if (localValue === null || cloudNewer || localValue === cloudValue) {
        // Molnet vinner (eller värdena är identiska): använd molnets värde.
        if (cloudValue !== null) {
          if (cloudValue !== localValue) adopted = true;
          localStorage.setItem(key, cloudValue);
          if (Number.isFinite(cloudAt)) meta[key] = cloudAt;
        }
        if (cloudValue !== null) cache.set(key, cloudValue);
      } else {
        // Lokala data är nyare: behåll och ladda upp.
        cache.set(key, localValue);
        uploads.push(pushToCloud(userId, key, localValue));
      }
    } else if (localValue !== null) {
      // Finns bara lokalt: ladda upp.
      cache.set(key, localValue);
      uploads.push(pushToCloud(userId, key, localValue));
    }
  }

  writeMeta(meta);
  // Tillämpa bara om användaren inte loggat ut under tiden.
  if (activeUserId === userId) {
    cloudCache = cache;
  }
  await Promise.all(uploads);
  return adopted;
}

// ---- Brygga mot auth -------------------------------------------------------

/**
 * Anropas från AuthProvider när auth-tillståndet ändras.
 * - Inloggad: startar merge och aktiverar molnsynk.
 * - Utloggad: återgår till rent lokal läge.
 *
 * Vid sign-in/utloggning laddas sidan om så att komponenternas
 * in-memory-tillstånd startar om från (de nya) localStorage-värdena.
 */
export function onAuthChanged(userId: string | null) {
  if (!userId) {
    const wasSignedIn = activeUserId !== null;
    activeUserId = null;
    cloudCache = null;
    mergeUserId = null;
    if (wasSignedIn) window.location.reload();
    return;
  }
  activeUserId = userId;
  if (cloudCache !== null) return; // Redan synkad för den här sessionen.
  if (mergeUserId !== userId) {
    mergeUserId = userId;
    void performMerge(userId).then((adopted) => {
      if (mergeUserId === userId) mergeUserId = null;
      // Reload bara om molnet faktiskt ändrade lokal data (annars ingen poäng).
      if (adopted && activeUserId === userId) window.location.reload();
    });
  }
}

// ---- Det synkrona API:et (ersätter localStorage-metoderna) ----------------

/** Läser en nyckel. Molnets spegel används när den är laddad, annars lokal. */
export function storageGet(key: string): string | null {
  if (cloudCache !== null && cloudCache.has(key)) {
    return cloudCache.get(key) ?? null;
  }
  return localStorage.getItem(key);
}

/** Skriver en nyckel. Lokal cache skrivs alltid; molnet om inloggad. */
export function storageSet(key: string, value: string): void {
  localStorage.setItem(key, value);
  const meta = readMeta();
  meta[key] = Date.now();
  writeMeta(meta);

  if (cloudCache !== null) {
    cloudCache.set(key, value);
    if (activeUserId) void pushToCloud(activeUserId, key, value);
  }
}

/** Raderar en nyckel lokalt och (om inloggad) i molnet. */
export function storageRemove(key: string): void {
  localStorage.removeItem(key);
  const meta = readMeta();
  delete meta[key];
  writeMeta(meta);

  if (cloudCache !== null) {
    cloudCache.delete(key);
    if (activeUserId) void deleteFromCloud(activeUserId, key);
  }
}

/**
 * Exponeras för felsökning/tester: är molnsynk aktiv just nu?
 * (Behövs i praktiken inte av appen.)
 */
export function isCloudSyncActive(): boolean {
  return isSupabaseConfigured() && cloudCache !== null;
}
