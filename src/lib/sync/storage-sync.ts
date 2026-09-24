/**
 * Drop-in-ersättning för localStorage med Supabase-synk när användaren är
 * inloggad.
 *
 * - Utloggad: exakt samma beteende som localStorage (anonym läge).
 * - Inloggad: localStorage behålls som offline-cache, men molnet
 *   (user_state-tabellen) är källa till sanning. Vid inloggning mergas
 *   molnet med lokala data nyckel för nyckel — "nyaste vinner".
 *
 * Ordning ("nyaste vinner") använder en monoton lokal baslinje per nyckel
 * (`meta[key]`, enbart skrivtider från den här enheten) mot molnets
 * `updated_at`. Molntidstämplar skrivs aldrig tillbaka till `meta`, så en
 * enhet som anammar en molnredigering får inte en "framtida" baslinje som
 * gör en senare lokal redigering äldre än den är. Konfliktsemantik: om
 * molnet och lokalt skiljer sig vinner den nyaste tidstämpeln; vid exakt
 * lika väger molnet tyngst. Kvarstår: vid klockskew mellan enheter (fullt
 * fix kräver servertid, d.v.s. en DB-ändring) kan ordningen bli ungefärlig.
 *
 * Raderingar synkas med tombstones: en raderad nyckel lagras lokalt och i
 * molnet som den reserverade strängen TOMBSTONE i stället för att plockas
 * bort, så att en äldre molnkopia inte återuppstår vid nästa merge.
 *
 * Vid utloggning läggs den lokala kopian undan per konto
 * (`hp-lift-archive-<userId>`) innan den delade cachen rensas, och läggs
 * tillbaka vid nästa inloggning för samma konto. Molnets kopia berörs inte,
 * och nästa användare på samma enhet ser aldrig den utloggades data.
 *
 * API:et är synkront (samma former som localStorage) så att befintliga
 * anrop kan bytas rakt av. Molnskrivningar skickas asynkront och fel
 * sväljs med console.warn — appen får aldrig krascha p.g.a. nätverksfel
 * eller misslyckade localStorage-skrivningar (kvot/privat läge).
 *
 * Känd begränsning: samtidig redigering i två flikar/enheter synkas inte
 * i realtid; sista skrivning per nyckel vinner vid nästa inloggning.
 * Läsningar i samma flik ser dock alltid den färskaste lokala kopian
 * (se storageGet).
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

const META_KEY = "hp-lift-sync-meta-v1";

/**
 * Reserverad markör för en raderad nyckel (tombstone). Används både i
 * localStorage och som molnets `{"v": TOMBSTONE}` så att en radering kan
 * spridas och aldrig skrivs över av en äldre molnkopia. Inget appvärde
 * använder den här strängen, så befintliga lagrade JSON-värden ("1", "0",
 * objekt/arrayer) fortsätter att fungera som vanliga värden.
 */
const TOMBSTONE = "__hp_lift_deleted__";

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
  "hp-lift-gamification-v1",
] as const;

type CloudRow = {
  storage_key: string;
  value: { v?: string } | null;
  updated_at: string;
};

/**
 * Prefix för undanlagd lokal data per användar-id. Skrivs vid utloggning och
 * läggs tillbaka vid nästa inloggning för samma konto, så att ändringar som
 * inte hann synkas till molnet inte försvinner när den delade lokala cachen
 * rensas (flera användare på samma enhet).
 */
const ARCHIVE_PREFIX = "hp-lift-archive-";

type LocalSnapshot = {
  at: number;
  values: Record<string, string>;
  meta: Record<string, number>;
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

// ---- Säkra localStorage-åtkomster (kvot/privat läge får aldrig krascha) ---

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn(`[sync] Kunde inte skriva "${key}" till localStorage.`);
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignorera */
  }
}

// ---- Lokal skrivtid -------------------------------------------------------

/**
 * Monoton lokal baslinje per nyckel (skrivtider, enbart den här enhetens
 * klocka). Normaliseras till ett objekt så att en korrupt/`null`-blob aldrig
 * gör att `meta[key]` kastar.
 */
function readMeta(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(safeGetItem(META_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}

function writeMeta(meta: Record<string, number>) {
  safeSetItem(META_KEY, JSON.stringify(meta));
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

/** Sprider en radering som en tombstone-rad i molnet (raderar inte raden). */
async function pushTombstone(userId: string, key: string, at: number) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: userId,
      storage_key: key,
      value: { v: TOMBSTONE },
      updated_at: new Date(at).toISOString(),
    },
    { onConflict: "user_id,storage_key" },
  );
  if (error) console.warn(`[sync] Kunde inte sprida radering av "${key}" till molnet:`, error.message);
}

// ---- Merge vid inloggning -------------------------------------------------

type LocalEntry =
  | { kind: "missing" }
  | { kind: "value"; value: string }
  | { kind: "tombstone" };

function parseLocal(raw: string | null): LocalEntry {
  if (raw === null) return { kind: "missing" };
  if (raw === TOMBSTONE) return { kind: "tombstone" };
  return { kind: "value", value: raw };
}

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

  // Avbryt om användaren loggade ut medan hämtningen pågick — annars kan
  // merge skriva in den utloggade användarens molnvärden i localStorage.
  if (activeUserId !== userId) return;

  const meta = readMeta();
  const rows = (data ?? []) as CloudRow[];
  const rowByKey = new Map(rows.map((r) => [r.storage_key, r]));

  const uploads: Array<Promise<void>> = [];
  const cache = new Map<string, string>();
  // Sant om molnet faktiskt ändrade lokal data — då krävs en reload så att
  // komponenternas in-memory-tillstånd återspeglar molnet.
  let adopted = false;

  for (const key of SYNCED_KEYS) {
    const row = rowByKey.get(key);
    const localEntry = parseLocal(safeGetItem(key));
    const localAt = meta[key] ?? 0;

    if (!row) {
      // Finns bara lokalt: ladda upp. Tombstones behöver inget (molnet
      // saknar redan raden) men behålls lokalt som skydd mot återuppstånd.
      if (localEntry.kind === "value") {
        cache.set(key, localEntry.value);
        uploads.push(pushToCloud(userId, key, localEntry.value));
      }
      continue;
    }

    const cloudAt = new Date(row.updated_at).getTime();
    const cloudNewer = Number.isFinite(cloudAt) ? cloudAt >= localAt : true;
    const cloudValue = unwrap(row.value);
    const cloudIsTombstone = cloudValue === TOMBSTONE;

    if (cloudIsTombstone) {
      if (localEntry.kind === "value" && !cloudNewer) {
        // Lokal redigering är nyare än raderingen: behåll och ladda upp
        // (skriver över molnets tombstone).
        cache.set(key, localEntry.value);
        uploads.push(pushToCloud(userId, key, localEntry.value));
      } else if (localEntry.kind === "value") {
        // Raderingen vinner över ett äldre lokalt värde: skriv en lokal
        // tombstone (tid i meta, enbart lokal klocka).
        safeSetItem(key, TOMBSTONE);
        meta[key] = Math.max(meta[key] ?? 0, Date.now());
        adopted = true;
      }
      // missing/tombstone: redan borta eller redan raderad — inget att göra.
      continue;
    }

    if (cloudValue === null) {
      // Molnrad utan värde (legacy {}): behandla som frånvarande.
      if (localEntry.kind === "value") {
        cache.set(key, localEntry.value);
        uploads.push(pushToCloud(userId, key, localEntry.value));
      }
      continue;
    }

    if (localEntry.kind === "value") {
      if (localEntry.value === cloudValue) {
        // Värdena är identiska: använd molnets (ingen skillnad).
        cache.set(key, cloudValue);
      } else if (cloudNewer) {
        // Molnet är nyast: använd molnets värde. Skriv aldrig cloudAt till
        // meta — baslinjen ska bara spegla lokala skrivtider.
        safeSetItem(key, cloudValue);
        cache.set(key, cloudValue);
        adopted = true;
      } else {
        // Lokala data är nyare: behåll och ladda upp.
        cache.set(key, localEntry.value);
        uploads.push(pushToCloud(userId, key, localEntry.value));
      }
    } else if (localEntry.kind === "tombstone") {
      if (cloudNewer) {
        // Molnet har ett värde nyare än raderingen: återställ lokalt.
        safeSetItem(key, cloudValue);
        cache.set(key, cloudValue);
        adopted = true;
      } else {
        // Raderingen är nyare: sprid den till molnet.
        uploads.push(pushTombstone(userId, key, localAt));
      }
    } else {
      // Nyckeln saknas lokalt: använd molnets värde.
      safeSetItem(key, cloudValue);
      cache.set(key, cloudValue);
      adopted = true;
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

// ---- Undanlagd lokal data (utloggning utan dataförlust) --------------------

/** Sparar undan den lokala kopian under användarens id. */
function archiveLocalState(userId: string): void {
  const values: Record<string, string> = {};
  for (const key of SYNCED_KEYS) {
    const raw = safeGetItem(key);
    if (raw !== null) values[key] = raw;
  }
  if (Object.keys(values).length === 0) return;
  const snapshot: LocalSnapshot = { at: Date.now(), values, meta: readMeta() };
  try {
    localStorage.setItem(ARCHIVE_PREFIX + userId, JSON.stringify(snapshot));
  } catch {
    // Kvot/privat läge: hellre tappa arkivet än att krascha utloggningen.
  }
}

/** Lägger tillbaka undanlagd lokal data. Nyare lokalt värde vinner per nyckel. */
function restoreArchivedState(userId: string): void {
  const archiveKey = ARCHIVE_PREFIX + userId;
  const raw = safeGetItem(archiveKey);
  if (!raw) return;
  safeRemoveItem(archiveKey);
  const synced = new Set<string>(SYNCED_KEYS);
  try {
    const snapshot = JSON.parse(raw) as LocalSnapshot;
    const meta = readMeta();
    for (const [key, value] of Object.entries(snapshot.values ?? {})) {
      if (!synced.has(key)) continue;
      const archivedAt = snapshot.meta?.[key] ?? snapshot.at ?? 0;
      const localAt = meta[key] ?? 0;
      if (archivedAt < localAt) continue;
      safeSetItem(key, value);
      meta[key] = archivedAt;
    }
    writeMeta(meta);
  } catch {
    // Korrupt arkiv: ignorera.
  }
}

/** Raderar all sparad träning lokalt: synkade nycklar, undanlagd data och meta. */
export function clearLocalData(): void {
  clearSyncedLocalState();
  const archives: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(ARCHIVE_PREFIX)) archives.push(key);
  }
  for (const key of archives) safeRemoveItem(key);
}

/** Rensar den delade lokala synk-cachen (alla synkade nycklar + meta). */
function clearSyncedLocalState() {
  for (const key of SYNCED_KEYS) safeRemoveItem(key);
  safeRemoveItem(META_KEY);
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
    const previousUserId = activeUserId;
    activeUserId = null;
    cloudCache = null;
    mergeUserId = null;
    if (previousUserId !== null) {
      // Rensa den delade lokala cachen så att nästa användare (anonym eller
      // inloggad) aldrig ser den utloggade användarens data — men lägg undan
      // kopian under användarens id först, så att ändringar som inte hann
      // synkas till molnet kan läggas tillbaka vid nästa inloggning.
      archiveLocalState(previousUserId);
      clearSyncedLocalState();
      window.location.reload();
    }
    return;
  }
  activeUserId = userId;
  // Lägg tillbaka undanlagd data innan merge, så att jämförelsen sker mot rätt
  // lokala värden. Görs före cache-kollen: arkivet ska alltid tillbaka.
  restoreArchivedState(userId);
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

/**
 * Läser en nyckel. Molnets spegel används när den är laddad, annars lokal.
 * Om localStorage avviker från spegeln (t.ex. en annan flik har skrivit)
 * vinner alltid den färskaste lokala kopian, och spegeln uppdateras.
 */
export function storageGet(key: string): string | null {
  const localRaw = safeGetItem(key);
  if (cloudCache !== null && cloudCache.has(key)) {
    const cached = cloudCache.get(key) ?? null;
    const localEntry = parseLocal(localRaw);
    const localValue = localEntry.kind === "value" ? localEntry.value : null;
    if (localValue === cached) return cached;
    // localStorage avviker från spegeln: en annan flik har skrivit (eller
    // raderat) nyare data. Låt localStorage vinna och uppdatera spegeln.
    if (localEntry.kind === "value") {
      cloudCache.set(key, localEntry.value);
      return localEntry.value;
    }
    cloudCache.delete(key);
    return null;
  }
  const parsed = parseLocal(localRaw);
  return parsed.kind === "value" ? parsed.value : null;
}

/** Skriver en nyckel. Lokal cache skrivs alltid; molnet om inloggad. */
export function storageSet(key: string, value: string): void {
  safeSetItem(key, value);
  const meta = readMeta();
  meta[key] = Math.max(meta[key] ?? 0, Date.now());
  writeMeta(meta);

  if (cloudCache !== null) {
    cloudCache.set(key, value);
    if (activeUserId) void pushToCloud(activeUserId, key, value);
  }
}

/** Raderar en nyckel lokalt (tombstone) och (om inloggad) i molnet. */
export function storageRemove(key: string): void {
  safeSetItem(key, TOMBSTONE);
  const meta = readMeta();
  meta[key] = Math.max(meta[key] ?? 0, Date.now());
  writeMeta(meta);

  if (cloudCache !== null) {
    cloudCache.delete(key);
    if (activeUserId) void pushTombstone(activeUserId, key, meta[key]);
  }
}

/**
 * Exponeras för felsökning/tester: är molnsynk aktiv just nu?
 * (Behövs i praktiken inte av appen.)
 */
export function isCloudSyncActive(): boolean {
  return isSupabaseConfigured() && cloudCache !== null;
}
