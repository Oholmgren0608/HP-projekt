/**
 * Sammanslagning post för post av de synkade nycklarna (se storage-sync.ts).
 *
 * Används när både den här enheten och molnet har ändrat samma nyckel sedan
 * förra synken. Reglerna ska aldrig tappa något som någon av sidorna har gjort:
 *
 * - Loggar och mängder (historik, visade frågor, felkort, belönade veckor och
 *   dueller) slås ihop som union.
 * - Där en borttagning är något användaren gjort (mastery, veckoplanens bockar
 *   och poäng, låsta veckor, lästa texter) jämförs båda sidor med värdet vid
 *   förra synken ("basen"), så att en borttagning på ena sidan respekteras.
 * - Räknare (XP, statistik, flashcards) blir bas + ändringen på varje sida.
 * - Inställningar och inmatade poäng slås inte ihop: den som synkar sist
 *   vinner, alltså den här enheten (molnets ändring kom före).
 *
 * Är basen okänd (data som synkades med den äldre koden) vet vi inte vad sidorna
 * redan delar. Då blir räknare det största av de två värdena i stället för
 * summan, så att ingenting räknas dubbelt.
 *
 * Alla funktioner tar och ger råa localStorage-strängar.
 */

/** Reserverad markör för en raderad nyckel (samma som i storage-sync). */
export const TOMBSTONE = "__hp_lift_deleted__";

/** Värdet vid förra lyckade synken. `raw: null` = nyckeln fanns inte då. */
export type Base = { known: true; raw: string | null } | { known: false };

type Merger = (base: Base, local: string, remote: string) => string;

/** Samma tak som progress-history.ts (saveHistory). */
const HISTORY_CAP = 80;

// ---- Hjälpare -----------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function parse(raw: string | null): Json | undefined {
  if (raw === null || raw === TOMBSTONE) return undefined;
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return undefined;
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectOr(value: Json | undefined, fallback: JsonObject = {}): JsonObject {
  return isObject(value) ? value : fallback;
}

/** JSON med sorterade nycklar, för att känna igen samma post på båda sidor. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * En räknare: basen plus ändringen på varje sida. Saknas räknaren på en sida
 * räknas den som oförändrad. Okänd bas: det största värdet.
 */
export function addDeltas(
  base: number | undefined,
  local: number | undefined,
  remote: number | undefined,
  baseKnown: boolean,
): number {
  const l = local ?? base ?? 0;
  const r = remote ?? base ?? 0;
  if (!baseKnown) return Math.max(l, r);
  const b = base ?? 0;
  return b + (l - b) + (r - b);
}

function truthyKeys(map: JsonObject): Set<string> {
  return new Set(Object.keys(map).filter((key) => Boolean(map[key])));
}

/**
 * Trevägs-sammanslagning av vilka nycklar som finns: (L∩R) ∪ (L\B) ∪ (R\B).
 * Det ena sidan lagt till finns kvar, det ena sidan tagit bort (och den andra
 * inte rört) är borta. Okänd bas: union.
 */
function mergeKeySets(base: JsonObject | null, local: JsonObject, remote: JsonObject): Set<string> {
  const l = truthyKeys(local);
  const r = truthyKeys(remote);
  if (!base) return new Set([...l, ...r]);
  const b = truthyKeys(base);
  const out = new Set<string>();
  for (const key of l) if (r.has(key) || !b.has(key)) out.add(key);
  for (const key of r) if (!b.has(key)) out.add(key);
  return out;
}

function baseObject(base: Base): JsonObject | null {
  return base.known ? objectOr(parse(base.raw)) : null;
}

// ---- Regler per nyckel ------------------------------------------------------------

/** Historik: union av händelser, i tidsordning, med samma tak som appen. */
function mergeHistory(_base: Base, local: string, remote: string): string {
  const l = parse(local);
  const r = parse(remote);
  if (!Array.isArray(l)) return remote;
  if (!Array.isArray(r)) return local;
  const byKey = new Map<string, Json>();
  for (const event of [...r, ...l]) byKey.set(canonical(event), event);
  const events = [...byKey.entries()].sort(([ka, a], [kb, b]) => {
    const ta = isObject(a) && typeof a.at === "string" ? a.at : "";
    const tb = isObject(b) && typeof b.at === "string" ? b.at : "";
    return ta === tb ? ka.localeCompare(kb) : ta.localeCompare(tb);
  });
  return JSON.stringify(events.slice(-HISTORY_CAP).map(([, event]) => event));
}

/** Visade frågor per delprov: union, ordnad från äldst till senast visad. */
function mergeSeen(_base: Base, local: string, remote: string): string {
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const kind of new Set([...Object.keys(l), ...Object.keys(r)])) {
    const lists = [l[kind], r[kind]].filter(Array.isArray) as Json[][];
    const rank = new Map<string, number>();
    for (const list of lists) {
      list.forEach((id, i) => {
        if (typeof id !== "string") return;
        const fromEnd = list.length - 1 - i;
        rank.set(id, Math.min(rank.get(id) ?? Infinity, fromEnd));
      });
    }
    out[kind] = [...rank.entries()]
      .sort(([ia, ra], [ib, rb]) => (rb - ra) || ia.localeCompare(ib))
      .map(([id]) => id);
  }
  return JSON.stringify(out);
}

/** Mastery: serien per fråga. Ett fel (borttagen serie) respekteras. */
function mergeMastery(base: Base, local: string, remote: string): string {
  const b = baseObject(base);
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const id of new Set([...Object.keys(l), ...Object.keys(r), ...Object.keys(b ?? {})])) {
    const lv = num(l[id]);
    const rv = num(r[id]);
    let value: number | undefined;
    if (b) {
      const bv = num(b[id]);
      if (lv === bv) value = rv;
      else if (rv === bv) value = lv;
      else value = lv === undefined || rv === undefined ? undefined : Math.max(lv, rv);
    } else {
      value = lv === undefined && rv === undefined ? undefined : Math.max(lv ?? 0, rv ?? 0);
    }
    if (value !== undefined) out[id] = value;
  }
  return JSON.stringify(out);
}

/** Felkort: union per fråga. Kortet med flest misstag och repetitioner vinner. */
function mergeSrs(_base: Base, local: string, remote: string): string {
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const id of new Set([...Object.keys(l), ...Object.keys(r)])) {
    if (id.startsWith("hp-")) continue; // UHR-frågor visas aldrig
    const a = l[id];
    const c = r[id];
    if (!isObject(a)) {
      if (isObject(c)) out[id] = c;
      continue;
    }
    if (!isObject(c)) {
      out[id] = a;
      continue;
    }
    const order =
      (num(a.lapses) ?? 0) - (num(c.lapses) ?? 0) ||
      (num(a.reps) ?? 0) - (num(c.reps) ?? 0) ||
      String(a.due ?? "").localeCompare(String(c.due ?? "")) ||
      canonical(a).localeCompare(canonical(c));
    out[id] = order >= 0 ? a : c;
  }
  return JSON.stringify(out);
}

/** Veckoplanens bockar och lästa texter: vilka som är gjorda, trevägs. */
function mergeDoneSet(base: Base, local: string, remote: string): string {
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const key of mergeKeySets(baseObject(base), l, r)) out[key] = l[key] ?? r[key] ?? true;
  return JSON.stringify(out);
}

/** Poäng per veckouppgift: som bockarna, och det senast sparade vinner. */
function mergeWeekScores(base: Base, local: string, remote: string): string {
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const key of mergeKeySets(baseObject(base), l, r)) {
    const a = l[key];
    const c = r[key];
    if (isObject(a) && isObject(c)) {
      const order = String(a.at ?? "").localeCompare(String(c.at ?? "")) || canonical(a).localeCompare(canonical(c));
      out[key] = order >= 0 ? a : c;
    } else {
      out[key] = a ?? c ?? null;
    }
  }
  return JSON.stringify(out);
}

/** Låsta veckor: trevägs. Har båda sidor låst samma vecka olika vinner molnet. */
function mergeLockedWeeks(base: Base, local: string, remote: string): string {
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const key of mergeKeySets(baseObject(base), l, r)) out[key] = r[key] ?? l[key] ?? null;
  return JSON.stringify(out);
}

/** Flashcards: union av kort, räknarna som bas + ändringar. */
function mergeFlashcards(base: Base, local: string, remote: string): string {
  const b = baseObject(base);
  const l = objectOr(parse(local));
  const r = objectOr(parse(remote));
  const out: JsonObject = {};
  for (const id of new Set([...Object.keys(l), ...Object.keys(r)])) {
    const lc = objectOr(l[id]);
    const rc = objectOr(r[id]);
    const bc = b ? objectOr(b[id]) : {};
    const card: JsonObject = {
      correct: addDeltas(num(bc.correct), num(lc.correct), num(rc.correct), Boolean(b)),
      wrong: addDeltas(num(bc.wrong), num(lc.wrong), num(rc.wrong), Boolean(b)),
    };
    const localChanged = canonical(lc) !== canonical(bc);
    const last = (localChanged ? lc.last : undefined) ?? rc.last ?? lc.last;
    if (last !== undefined) card.last = last;
    out[id] = card;
  }
  return JSON.stringify(out);
}

/** Mängd som bara växer ({ id: true }): union. */
function mergeUnionSet(_base: Base, local: string, remote: string): string {
  const out: JsonObject = {};
  for (const key of mergeKeySets(null, objectOr(parse(local)), objectOr(parse(remote)))) out[key] = true;
  return JSON.stringify(out);
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000);
}

function dateFromDay(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

function laterDate(a: unknown, b: unknown): string | null {
  const x = typeof a === "string" ? a : null;
  const y = typeof b === "string" ? b : null;
  if (!x) return y;
  if (!y) return x;
  return x >= y ? x : y;
}

function mergeCounterMap(
  base: JsonObject | null,
  local: JsonObject,
  remote: JsonObject,
): JsonObject {
  const out: JsonObject = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const value = addDeltas(num(base?.[key]), num(local[key]), num(remote[key]), Boolean(base));
    out[key] = value;
  }
  return out;
}

/** Gamification: XP och statistik adderas, streak och uppdrag räknas om. */
function mergeGamification(base: Base, local: string, remote: string): string {
  const L = objectOr(parse(local));
  const R = objectOr(parse(remote));
  const B = baseObject(base);
  const known = Boolean(B);

  const out: JsonObject = { ...R, ...L };
  out.xp = addDeltas(num(B?.xp), num(L.xp), num(R.xp), known);
  out.stats = mergeCounterMap(B ? objectOr(B.stats) : null, objectOr(L.stats), objectOr(R.stats));

  // Dagens mätare: samma dag = räknare, olika dagar = den senare dagen.
  const lt = objectOr(L.today);
  const rt = objectOr(R.today);
  if (lt.date === rt.date) {
    const bt = B ? objectOr(B.today) : null;
    const sameDayBase = bt && bt.date === lt.date ? bt : known ? {} : null;
    const lCounters = { ...lt };
    const rCounters = { ...rt };
    delete lCounters.date;
    delete rCounters.date;
    out.today = { ...mergeCounterMap(sameDayBase, lCounters, rCounters), date: lt.date ?? null };
  } else {
    out.today = laterDate(lt.date, rt.date) === lt.date ? lt : rt;
  }

  // Dagens uppdrag: samma dag = klart på någon sida är klart.
  const lq = objectOr(L.quests);
  const rq = objectOr(R.quests);
  if (lq.date === rq.date && Array.isArray(lq.items)) {
    const remoteItems = new Map(
      (Array.isArray(rq.items) ? rq.items : []).filter(isObject).map((item) => [String(item.id), item]),
    );
    const items = lq.items.filter(isObject).map((item) => {
      const other = remoteItems.get(String(item.id));
      if (!other) return item;
      return {
        ...item,
        done: Boolean(item.done) || Boolean(other.done),
        progress: Math.max(num(item.progress) ?? 0, num(other.progress) ?? 0),
      };
    });
    out.quests = { ...lq, items, allDone: items.length > 0 && items.every((item) => item.done === true) };
  } else {
    out.quests = laterDate(lq.date, rq.date) === lq.date ? lq : rq;
  }

  // Aktiva dagar: union, de senaste 14.
  const days = new Set([...Object.keys(objectOr(L.activeDays)), ...Object.keys(objectOr(R.activeDays))]);
  const ls = objectOr(L.streak);
  const rs = objectOr(R.streak);
  const lastActive = laterDate(ls.lastActive, rs.lastActive);
  const newest = [...days, lastActive ?? ""].filter(Boolean).sort().pop();
  const cutoff = newest ? dateFromDay(dayNumber(newest) - 13) : "";
  const activeDays: JsonObject = {};
  for (const day of [...days].sort()) if (day >= cutoff) activeDays[day] = true;
  out.activeDays = activeDays;

  // Streak: den senare sidans serie, förlängd om dagarna däremellan är aktiva.
  let current = 0;
  if (ls.lastActive === rs.lastActive) {
    current = Math.max(num(ls.current) ?? 0, num(rs.current) ?? 0);
  } else if (!ls.lastActive || !rs.lastActive) {
    current = num((ls.lastActive ? ls : rs).current) ?? 0;
  } else {
    const later = lastActive === ls.lastActive ? ls : rs;
    const earlier = later === ls ? rs : ls;
    const from = dayNumber(String(earlier.lastActive));
    const to = dayNumber(String(later.lastActive));
    let chained = true;
    for (let day = from + 1; day <= to; day++) {
      if (!days.has(dateFromDay(day))) chained = false;
    }
    current = chained
      ? Math.max(num(later.current) ?? 0, (num(earlier.current) ?? 0) + (to - from))
      : num(later.current) ?? 0;
  }
  out.streak = {
    current,
    best: Math.max(num(ls.best) ?? 0, num(rs.best) ?? 0, current),
    lastActive,
  };

  // Achievements: union, första upplåsningen och "sedd" om någon sida sett den.
  const la = objectOr(L.achievements);
  const ra = objectOr(R.achievements);
  const achievements: JsonObject = {};
  for (const id of new Set([...Object.keys(la), ...Object.keys(ra)])) {
    const a = objectOr(la[id]);
    const c = objectOr(ra[id]);
    const unlocked = [a.unlockedAt, c.unlockedAt].filter((v) => typeof v === "string").sort()[0] ?? null;
    achievements[id] = { unlockedAt: unlocked, seen: Boolean(a.seen) || Boolean(c.seen) };
  }
  out.achievements = achievements;
  out.onboarded = Boolean(L.onboarded) || Boolean(R.onboarded);

  return JSON.stringify(out);
}

const MERGERS: Record<string, Merger> = {
  "hp-lift-history-v1": mergeHistory,
  "hp-lift-seen-questions-v1": mergeSeen,
  "hp-lift-mastery-v2": mergeMastery,
  "hp-lift-srs-v1": mergeSrs,
  "hp-studieplan-progress-v2": mergeDoneSet,
  "hp-studieplan-scores-v1": mergeWeekScores,
  "hp-lift-locked-weeks-v1": mergeLockedWeeks,
  "hp-flashcards-progress-v1": mergeFlashcards,
  "hp-reading-done-v1": mergeDoneSet,
  "hp-lift-gamification-v1": mergeGamification,
  "hp-lift-weeks-rewarded-v1": mergeUnionSet,
  "hp-lift-reported-duels-v1": mergeUnionSet,
};

/** Nycklar vars regel behöver värdet vid förra synken (basen). */
export const NEEDS_BASE: ReadonlySet<string> = new Set([
  "hp-lift-mastery-v2",
  "hp-studieplan-progress-v2",
  "hp-studieplan-scores-v1",
  "hp-lift-locked-weeks-v1",
  "hp-flashcards-progress-v1",
  "hp-reading-done-v1",
  "hp-lift-gamification-v1",
]);

/**
 * Slår ihop den här enhetens värde med molnets. Båda har ändrats sedan basen.
 * Nycklar utan egen regel (inställningar, inmatade poäng) och raderingar:
 * den här enhetens värde vinner, eftersom den synkar sist.
 */
export function mergeValues(key: string, base: Base, local: string, remote: string): string {
  if (local === remote) return local;
  const merger = MERGERS[key];
  if (!merger || local === TOMBSTONE || remote === TOMBSTONE) return local;
  try {
    return merger(base, local, remote);
  } catch {
    return local;
  }
}
