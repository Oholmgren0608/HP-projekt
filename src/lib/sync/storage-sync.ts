/**
 * Drop-in-ersättning för localStorage med Supabase-synk när användaren är
 * inloggad.
 *
 * - Utloggad: exakt samma beteende som localStorage (gästläge). Det som
 *   skrivs märks som gästdata.
 * - Inloggad: localStorage är fortfarande den lokala kopian, och varje synkad
 *   nyckel har en rad i user_state. Serverns updated_at (migration 0032) är
 *   radens version.
 *
 * Per nyckel sparas en synkpost (`hp-lift-sync-v2`): versionen som det lokala
 * värdet senast stämdes av mot, om nyckeln ändrats lokalt sedan dess, och för
 * vissa nycklar värdet vid den versionen ("basen", se merge.ts).
 *
 * Två sätt att synka:
 * - Avstämning (vid inloggning och appstart): hämta alla rader. Har bara molnet
 *   ändrats tas molnets värde. Har båda ändrats slås de ihop post för post
 *   (merge.ts) och resultatet skrivs med versionskontroll. Ändrades lokal data
 *   laddas sidan om, så att komponenterna läser de nya värdena.
 * - Uppladdning (2 s efter en skrivning, när nätet kommer tillbaka och när
 *   fliken blir synlig): skicka de lokalt ändrade nycklarna med versions-
 *   kontroll. Har molnet ändrats under tiden skrivs ingenting, och nyckeln
 *   slås ihop vid nästa avstämning. Lokal data ändras aldrig här, så att
 *   komponenternas tillstånd i minnet stämmer med det som laddas upp.
 *
 * Skrivningar använder user_state_put (versionskontroll på servern), så en
 * enhet kan aldrig skriva över en ändring som den inte har sett. Enheternas
 * klockor används inte.
 *
 * Raderingar lagras som den reserverade strängen TOMBSTONE, lokalt och i
 * molnet. Vid utloggning läggs den lokala kopian undan per konto
 * (`hp-lift-archive-<userId>`) och den delade cachen rensas, så att nästa
 * användare på enheten aldrig ser den utloggades data.
 *
 * API:et är synkront (samma former som localStorage). Molnanrop sker i
 * bakgrunden och fel loggas med console.warn: appen får aldrig krascha på grund
 * av nätet eller en full localStorage.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { mergeValues, NEEDS_BASE, TOMBSTONE, type Base } from "./merge";

/** Synkposterna. Ersätter `hp-lift-sync-meta-v1` (lokala skrivtider). */
const RECORDS_KEY = "hp-lift-sync-v2";
const LEGACY_META_KEY = "hp-lift-sync-meta-v1";

/** Uppladdning så här länge efter senaste skrivningen. */
const PUSH_DELAY_MS = 2_000;
/** Antal nya försök när molnet ändras medan en sammanslagning skrivs. */
const MAX_CONFLICT_ROUNDS = 3;

/**
 * Alla appnycklar som synkas (speglar storage-nycklarna i modulerna).
 * Medvetet en explicit lista: session- och auth-nycklar ("hp-lift-auth",
 * "sb-*") får aldrig synkas.
 */
export const SYNCED_KEYS = [
  "hp-lift-scores-v1",
  "hp-lift-scores-saved-v1",
  "hp-lift-history-v1",
  "hp-lift-srs-v1",
  "hp-lift-mastery-v2",
  "hp-lift-seen-questions-v1",
  "hp-lift-adapt-plan-v1",
  "hp-lift-nivatest-counts-v1",
  "hp-lift-nivatest-timer-v1",
  "hp-lift-practice-mode-v1",
  "hp-lift-provpass-mode-v1",
  "hp-studieplan-progress-v2",
  "hp-studieplan-scores-v1",
  "hp-lift-locked-weeks-v1",
  "hp-flashcards-progress-v1",
  "hp-reading-done-v1",
  "hp-lift-gamification-v1",
  "hp-lift-weeks-rewarded-v1",
  "hp-lift-reported-duels-v1",
  "hp-lift-study-days-v1",
  "hp-lift-skipped-tasks-v1",
] as const;

const SYNCED = new Set<string>(SYNCED_KEYS);

/**
 * Lokala nycklar som inte synkas men rensas tillsammans med de synkade, så att
 * en tidigare användares data inte blir kvar på en delad enhet: nycklar som
 * inte längre används och per-match-data från dueller.
 */
const LOCAL_ONLY_KEYS = [
  "hp-lift-mastered-v1",
  "hp-lift-duel-questions-v1",
  "hp-lift-duel-questions-v2",
  "hp-lift-duel-bot-answers-v1",
  "hp-lift-duel-bot-decisions-v1",
] as const;

/**
 * Prefix för undanlagd lokal data per användar-id. Skrivs vid utloggning och
 * läggs tillbaka vid nästa inloggning för samma konto.
 */
const ARCHIVE_PREFIX = "hp-lift-archive-";

type SyncRecord = {
  /** Serverns version som det lokala värdet senast stämdes av mot. null = aldrig. */
  ver: string | null;
  /** Ändrad lokalt sedan dess. */
  dirty: boolean;
  /** Värdet vid `ver`, bara för nycklar i NEEDS_BASE. */
  base?: string | null;
  /** Skriven utan inloggning: delar ingen historik med kontot. */
  guest?: boolean;
  /** Fanns före synkposterna: vad den delar med molnet är okänt. */
  legacy?: boolean;
  /** Molnet har ändrats på ett sätt som den lokala kopian inte har med: slås ihop vid nästa avstämning. */
  needsMerge?: boolean;
};

type Records = Record<string, SyncRecord>;

type CloudValue = { v?: string } | null;

type LocalSnapshot = {
  at: number;
  values: Record<string, string>;
  records?: Records;
};

type PutResult =
  | { kind: "applied"; ver: string }
  | { kind: "conflict"; raw: string | null; ver: string | null }
  | { kind: "error" };

/** Molnet lagrar råa localStorage-strängar som {"v": "<sträng>"} (jsonb). */
function unwrap(value: CloudValue): string | null {
  return value && typeof value.v === "string" ? value.v : null;
}

// ---- Modultillstånd -------------------------------------------------------

let activeUserId: string | null = null;
/** Konto som raderas: dess data läggs inte undan vid utloggningen. */
let forgetUserId: string | null = null;
/** Synkar körs en i taget, i ordning. */
let syncChain: Promise<unknown> = Promise.resolve();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** Räknas upp vid varje lokal skrivning, för att se om en nyckel ändrats under en uppladdning. */
const writeSeq = new Map<string, number>();
let listenersInstalled = false;

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

// ---- Synkposter -----------------------------------------------------------

function readRecords(): Records {
  try {
    const parsed: unknown = JSON.parse(safeGetItem(RECORDS_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Records = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!SYNCED.has(key) || !value || typeof value !== "object") continue;
      const rec = value as Partial<SyncRecord>;
      out[key] = {
        ver: typeof rec.ver === "string" ? rec.ver : null,
        dirty: rec.dirty === true,
        ...(typeof rec.base === "string" || rec.base === null ? { base: rec.base } : {}),
        ...(rec.guest ? { guest: true } : {}),
        ...(rec.legacy ? { legacy: true } : {}),
        ...(rec.needsMerge ? { needsMerge: true } : {}),
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeRecords(records: Records): void {
  safeSetItem(RECORDS_KEY, JSON.stringify(records));
  safeRemoveItem(LEGACY_META_KEY);
}

/** Synkposten för en nyckel. Lokal data från före synkposterna blir "legacy". */
function recordFor(records: Records, key: string): SyncRecord | undefined {
  if (records[key]) return records[key];
  return safeGetItem(key) !== null ? { ver: null, dirty: true, legacy: true } : undefined;
}

function setRecord(key: string, rec: SyncRecord): void {
  const records = readRecords();
  records[key] = rec;
  writeRecords(records);
}

/** Basen för sammanslagningen: värdet vid förra synken, tomt eller okänt. */
function baseOf(rec: SyncRecord | undefined): Base {
  if (!rec || rec.legacy) return { known: false };
  if (rec.ver === null) return { known: true, raw: null };
  return "base" in rec ? { known: true, raw: rec.base ?? null } : { known: false };
}

/** Post efter en lyckad avstämning eller uppladdning av `raw` vid version `ver`. */
function syncedRecord(key: string, ver: string, raw: string | null, dirty = false): SyncRecord {
  return NEEDS_BASE.has(key) ? { ver, dirty, base: raw } : { ver, dirty };
}

/**
 * Efter en lyckad skrivning av `pushed` (läst som `local` innan anropet).
 * Kom en lokal skrivning under tiden förblir nyckeln ändrad: var det lokala
 * värdet som skickades kan det laddas upp igen, annars (en sammanslagning
 * skickades) måste det slås ihop vid nästa avstämning, med `local` som bas.
 */
function afterPut(key: string, ver: string, pushed: string, local: string, seq: number): void {
  if ((writeSeq.get(key) ?? 0) === seq) {
    setRecord(key, syncedRecord(key, ver, pushed));
    return;
  }
  if (pushed === local) {
    setRecord(key, syncedRecord(key, ver, pushed, true));
    schedulePush();
    return;
  }
  setRecord(key, {
    ...syncedRecord(key, ver, local, true),
    needsMerge: true,
  });
}

function markDirty(key: string): void {
  if (!SYNCED.has(key)) return;
  const records = readRecords();
  // Saknas posten är det en ny nyckel (värdet har just skrivits), inte legacy.
  const rec = records[key];
  records[key] = {
    ...(rec ?? { ver: null }),
    ver: rec?.ver ?? null,
    dirty: true,
    ...(activeUserId === null ? { guest: true } : {}),
  };
  writeRecords(records);
  writeSeq.set(key, (writeSeq.get(key) ?? 0) + 1);
}

// ---- Molnanrop ---------------------------------------------------------------

/** Skriver `raw` om molnets version fortfarande är `base` (null = ingen rad). */
async function putValue(key: string, base: string | null, raw: string): Promise<PutResult> {
  const supabase = getSupabase();
  if (!supabase) return { kind: "error" };
  try {
    const { data, error } = await supabase.rpc("user_state_put", {
      p_key: key,
      p_base: base,
      p_value: { v: raw },
    });
    if (error) {
      console.warn(`[sync] Kunde inte skriva "${key}" till molnet:`, error.message);
      return { kind: "error" };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.applied && typeof row.stored_at === "string") return { kind: "applied", ver: row.stored_at };
    return {
      kind: "conflict",
      raw: unwrap(row?.stored_value ?? null),
      ver: typeof row?.stored_at === "string" ? row.stored_at : null,
    };
  } catch (e) {
    console.warn(`[sync] Nätverksfel när "${key}" skulle skrivas:`, e);
    return { kind: "error" };
  }
}

async function fetchCloud(userId: string): Promise<Map<string, { raw: string | null; ver: string }> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("user_state")
      .select("storage_key, value, updated_at")
      .eq("user_id", userId);
    if (error) {
      console.warn("[sync] Kunde inte hämta molndata — fortsätter med lokal data:", error.message);
      return null;
    }
    const rows = (data ?? []) as Array<{ storage_key: string; value: CloudValue; updated_at: string }>;
    return new Map(rows.map((row) => [row.storage_key, { raw: unwrap(row.value), ver: row.updated_at }]));
  } catch (e) {
    console.warn("[sync] Nätverksfel vid hämtning av molndata:", e);
    return null;
  }
}

// ---- Avstämning -----------------------------------------------------------------

/**
 * Stämmer av en nyckel mot molnets rad. Returnerar sant om den lokala datan
 * ändrades. Vid nätverksfel avbryts den, och nyckeln förblir markerad som ändrad.
 */
async function reconcileKey(
  userId: string,
  key: string,
  remote: { raw: string | null; ver: string } | undefined,
): Promise<boolean> {
  const rec = recordFor(readRecords(), key);
  const local = safeGetItem(key);

  if (!remote) {
    // Raden finns inte i molnet: ladda upp det som finns lokalt.
    if (local === null) return false;
    const seq = writeSeq.get(key) ?? 0;
    const res = await putValue(key, null, local);
    if (activeUserId !== userId) return false;
    if (res.kind === "applied") {
      afterPut(key, res.ver, local, local, seq);
      return false;
    }
    if (res.kind !== "conflict" || res.ver === null) return false;
    remote = { raw: res.raw, ver: res.ver };
  }

  if (rec && rec.ver === remote.ver && !rec.needsMerge) {
    if (rec.dirty && local !== null && !rec.legacy && !rec.guest) {
      const seq = writeSeq.get(key) ?? 0;
      const res = await putValue(key, remote.ver, local);
      if (res.kind === "applied" && activeUserId === userId) afterPut(key, res.ver, local, local, seq);
    }
    return false;
  }

  // Molnet har en version som den här enheten inte har sett.
  if (local === null || local === remote.raw || !rec?.dirty) {
    let changed = false;
    if (remote.raw !== null && local !== remote.raw) changed = safeSetItem(key, remote.raw);
    setRecord(key, syncedRecord(key, remote.ver, remote.raw));
    return changed;
  }

  // Båda har ändrats: slå ihop och skriv med versionskontroll.
  const base = baseOf(rec);
  let target = remote;
  for (let round = 0; round < MAX_CONFLICT_ROUNDS; round++) {
    const merged = target.raw === null ? local : mergeValues(key, base, local, target.raw);
    const seq = writeSeq.get(key) ?? 0;
    const res = await putValue(key, target.ver, merged);
    if (res.kind === "error" || activeUserId !== userId) return false;
    if (res.kind === "applied") {
      const untouched = (writeSeq.get(key) ?? 0) === seq;
      const changed = untouched && merged !== local && safeSetItem(key, merged);
      afterPut(key, res.ver, merged, local, seq);
      return changed;
    }
    if (res.ver === null) return false;
    target = { raw: res.raw, ver: res.ver };
  }
  return false;
}

/** Avstämning av alla nycklar. Sant om lokal data ändrades. */
async function reconcileAll(userId: string): Promise<boolean> {
  const cloud = await fetchCloud(userId);
  if (!cloud || activeUserId !== userId) return false;
  let changed = false;
  for (const key of SYNCED_KEYS) {
    if (activeUserId !== userId) return false;
    if (await reconcileKey(userId, key, cloud.get(key))) changed = true;
  }
  return changed;
}

/** Laddar upp lokalt ändrade nycklar. Ändrar aldrig lokal data. */
async function pushDirty(userId: string): Promise<void> {
  for (const key of SYNCED_KEYS) {
    if (activeUserId !== userId) return;
    const rec = recordFor(readRecords(), key);
    const local = safeGetItem(key);
    if (!rec?.dirty || local === null) continue;
    // Legacy- och gästdata och nycklar med en väntande sammanslagning
    // hanteras vid nästa avstämning, inte här.
    if (rec.legacy || rec.guest || rec.needsMerge) continue;
    const seq = writeSeq.get(key) ?? 0;
    const res = await putValue(key, rec.ver, local);
    if (res.kind === "error") return; // nätet är borta: försök igen senare
    if (activeUserId !== userId) return;
    if (res.kind === "applied") {
      afterPut(key, res.ver, local, local, seq);
    } else {
      // Molnet har ändrats: slås ihop vid nästa avstämning.
      const current = readRecords()[key];
      if (current) setRecord(key, { ...current, needsMerge: true });
    }
  }
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = syncChain.then(task, task);
  syncChain = next.catch(() => undefined);
  return next;
}

function schedulePush(): void {
  if (!activeUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const userId = activeUserId;
    if (userId) void enqueue(() => pushDirty(userId));
  }, PUSH_DELAY_MS);
}

function pushNow(): void {
  const userId = activeUserId;
  if (userId) void enqueue(() => pushDirty(userId));
}

function installListeners(): void {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;
  window.addEventListener("online", pushNow);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pushNow();
    });
  }
}

// ---- Undanlagd lokal data (utloggning utan dataförlust) --------------------

/** Sparar undan den lokala kopian och synkposterna under användarens id. */
function archiveLocalState(userId: string): void {
  const values: Record<string, string> = {};
  for (const key of SYNCED_KEYS) {
    const raw = safeGetItem(key);
    if (raw !== null) values[key] = raw;
  }
  if (Object.keys(values).length === 0) return;
  const snapshot: LocalSnapshot = { at: Date.now(), values, records: readRecords() };
  try {
    localStorage.setItem(ARCHIVE_PREFIX + userId, JSON.stringify(snapshot));
  } catch {
    // Kvot/privat läge: hellre tappa arkivet än att krascha utloggningen.
  }
}

/**
 * Lägger tillbaka undanlagd data. Har gästen hunnit skriva samma nyckel slås
 * gästens data ihop med kontots (inget gemensamt ursprung).
 */
function restoreArchivedState(userId: string): void {
  const archiveKey = ARCHIVE_PREFIX + userId;
  const raw = safeGetItem(archiveKey);
  if (!raw) return;
  safeRemoveItem(archiveKey);
  try {
    const snapshot = JSON.parse(raw) as LocalSnapshot;
    const archived = snapshot.records ?? {};
    const records = readRecords();
    for (const [key, value] of Object.entries(snapshot.values ?? {})) {
      if (!SYNCED.has(key) || typeof value !== "string") continue;
      const rec: SyncRecord = archived[key] ?? { ver: null, dirty: true, legacy: true };
      const local = safeGetItem(key);
      if (local === null) {
        safeSetItem(key, value);
        records[key] = rec;
      } else {
        safeSetItem(key, mergeValues(key, { known: true, raw: null }, local, value));
        records[key] = { ...rec, dirty: true, guest: undefined };
      }
    }
    writeRecords(records);
  } catch {
    // Korrupt arkiv: ignorera.
  }
}

/** Raderar all sparad träning lokalt: synkade nycklar, undanlagd data och synkposter. */
export function clearLocalData(): void {
  clearSyncedLocalState();
  const archives: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(ARCHIVE_PREFIX)) archives.push(key);
  }
  for (const key of archives) safeRemoveItem(key);
}

/** Rensar den delade lokala cachen (alla synkade nycklar och synkposterna). */
function clearSyncedLocalState() {
  for (const key of SYNCED_KEYS) safeRemoveItem(key);
  for (const key of LOCAL_ONLY_KEYS) safeRemoveItem(key);
  safeRemoveItem(RECORDS_KEY);
  safeRemoveItem(LEGACY_META_KEY);
  writeSeq.clear();
}

/**
 * Anropas innan ett raderat konto loggas ut: dess data ska inte läggas undan
 * på enheten (och ett gammalt arkiv tas bort).
 */
export function forgetAccountOnDevice(userId: string): void {
  forgetUserId = userId;
  safeRemoveItem(ARCHIVE_PREFIX + userId);
}

// ---- Brygga mot auth -------------------------------------------------------

/**
 * Anropas från AuthProvider när auth-tillståndet ändras (även flera gånger
 * med samma användare, t.ex. INITIAL_SESSION och TOKEN_REFRESHED).
 * - Inloggad: lägger tillbaka undanlagd data och stämmer av mot molnet.
 *   Ändrades lokal data laddas sidan om.
 * - Utloggad: lägger undan kontots data, rensar och laddar om.
 */
export function onAuthChanged(userId: string | null) {
  if (!userId) {
    const previousUserId = activeUserId;
    activeUserId = null;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = null;
    if (previousUserId !== null) {
      if (forgetUserId !== previousUserId) archiveLocalState(previousUserId);
      forgetUserId = null;
      clearSyncedLocalState();
      window.location.reload();
    }
    return;
  }
  if (activeUserId === userId) return;
  activeUserId = userId;
  installListeners();
  restoreArchivedState(userId);
  if (!isSupabaseConfigured()) return;
  void enqueue(() => reconcileAll(userId)).then((changed) => {
    if (changed && activeUserId === userId) window.location.reload();
  });
}

// ---- Det synkrona API:et (ersätter localStorage-metoderna) ----------------

/** Läser en nyckel (null om den saknas eller är raderad). */
export function storageGet(key: string): string | null {
  const raw = safeGetItem(key);
  return raw === TOMBSTONE ? null : raw;
}

/** Skriver en nyckel lokalt; laddas upp i bakgrunden om användaren är inloggad. */
export function storageSet(key: string, value: string): void {
  if (!safeSetItem(key, value)) return;
  markDirty(key);
  schedulePush();
}

/** Raderar en nyckel lokalt (tombstone) och, om inloggad, i molnet. */
export function storageRemove(key: string): void {
  if (!safeSetItem(key, TOMBSTONE)) return;
  markDirty(key);
  schedulePush();
}

/** Är molnsynk aktiv just nu? */
export function isCloudSyncActive(): boolean {
  return isSupabaseConfigured() && activeUserId !== null;
}
