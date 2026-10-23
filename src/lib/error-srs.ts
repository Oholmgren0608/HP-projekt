import { isBankFromDatabase } from "@/lib/content/questions-provider";
import { findQuestionById, type ChoiceQuestion } from "@/lib/practice";
import { isCorrect } from "@/lib/quiz";
import { storageSet } from "@/lib/sync/storage-sync";
import { emitEvent, loadJson } from "@/lib/storage";

export const SRS_STORAGE_KEY = "hp-lift-srs-v1";
export const SRS_EVENT = "hp-lift-srs-changed";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export type SrsCard = {
  id: string;
  front: string;
  back: string;
  explain: string;
  kind: string;
  due: string;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  passage?: string;
  options?: string[];
};

function emitSrsChanged() {
  emitEvent(SRS_EVENT);
}

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local calendar day, whether stored as YYYY-MM-DD or a legacy ISO timestamp. */
function toLocalDateKey(isoOrKey: string): string {
  if (DATE_KEY.test(isoOrKey)) return isoOrKey;
  return localDateKey(new Date(isoOrKey));
}

function addDays(dateKey: string, days: number): string {
  const key = toLocalDateKey(dateKey);
  const [y, m, d] = key.split("-").map(Number);
  return localDateKey(new Date(y, m - 1, d + days));
}

function sameOptions(a: string[] | undefined, b: string[]): boolean {
  return !!a && a.length === b.length && a.every((option, i) => option === b[i]);
}

function hydrateCard(card: SrsCard): SrsCard {
  const q = findQuestionById(card.id);
  if (!q) return card;
  const next: SrsCard = { ...card };
  if (!card.passage && q.passage) next.passage = q.passage;
  // Alternativ, rätt svar och prompt kan ha ändrats i banken sedan kortet skapades
  // — kortet måste rätta mot aktuellt facit, annars lär det ut ett gammalt svar.
  // Jämför innehållet, inte referensen: ett nytt array varje gång fick loadSrs
  // att skriva (och stämpla om synk-tiden) vid varje läsning, så att den här
  // enhetens gamla kort skrev över nyare repetitioner från andra enheter.
  if (q.options.length && !sameOptions(card.options, q.options)) next.options = q.options;
  if (q.prompt !== card.front) next.front = q.prompt;
  const liveBack = q.options[q.correctIndex];
  if (liveBack && liveBack !== card.back) next.back = liveBack;
  if (q.explain !== card.explain) next.explain = q.explain;
  return next;
}

export function loadSrs(): Record<string, SrsCard> {
  const parsed = loadJson<Record<string, SrsCard>>(SRS_STORAGE_KEY, {});
  try {
    if (!parsed || typeof parsed !== "object") return {};
    let changed = false;
    const hydrated: Record<string, SrsCard> = {};
    for (const [id, card] of Object.entries(parsed)) {
      // Provfrågor kan aldrig publiceras igen; kortets kopia av UHR:s text tas bort.
      if (isProvfragaId(id)) {
        changed = true;
        continue;
      }
      const next = hydrateCard(card);
      if (
        next.passage !== card.passage ||
        next.options !== card.options ||
        next.explain !== card.explain ||
        next.back !== card.back ||
        next.front !== card.front
      ) {
        changed = true;
      }
      hydrated[id] = next;
    }
    if (changed) {
      storageSet(SRS_STORAGE_KEY, JSON.stringify(hydrated));
    }
    return hydrated;
  } catch {
    return {};
  }
}

function saveSrs(map: Record<string, SrsCard>) {
  if (typeof window === "undefined") return;
  storageSet(SRS_STORAGE_KEY, JSON.stringify(map));
  emitSrsChanged();
}

/** Provfrågor ur UHR:s prov har id på formen "hp-<datum>-p<n>-q<m>". */
export function isProvfragaId(id: string): boolean {
  return id.startsWith("hp-");
}

/**
 * Kortet sparar en kopia av frågan, så en fråga som inte längre är publicerad
 * (indragen efter felrapporter, avvisad eller en provfråga från före 0017)
 * skulle annars fortsätta visas. Provfrågor (id "hp-…") visas aldrig; övriga
 * kort göms när banken kommer från databasen men saknar frågan. Kortet ligger
 * kvar och dyker upp igen om frågan publiceras på nytt.
 */
function isShowable(card: SrsCard): boolean {
  if (isProvfragaId(card.id)) return false;
  return !isBankFromDatabase() || findQuestionById(card.id) !== undefined;
}

export function dueCards(map = loadSrs()): SrsCard[] {
  const today = localDateKey();
  return Object.values(map)
    .filter((c) => isShowable(c) && toLocalDateKey(c.due) <= today)
    .sort((a, b) => toLocalDateKey(a.due).localeCompare(toLocalDateKey(b.due)));
}

export function recordMissedQuestions(questions: ChoiceQuestion[], answers: Record<string, number>) {
  const map = loadSrs();
  const today = localDateKey();
  for (const q of questions) {
    if (isCorrect(q, answers)) continue;
    const existing = map[q.id];
    map[q.id] = {
      id: q.id,
      front: q.prompt,
      back: q.options[q.correctIndex],
      explain: q.explain,
      kind: q.kind,
      passage: q.passage,
      options: q.options,
      due: today,
      interval: 1,
      ease: existing?.ease ?? 2.3,
      reps: 0,
      lapses: (existing?.lapses ?? 0) + 1,
    };
  }
  saveSrs(map);
}

export function reviewSrsCard(id: string, remembered: boolean) {
  const map = loadSrs();
  const card = map[id];
  if (!card) return;
  const today = localDateKey();
  if (!remembered) {
    map[id] = {
      ...card,
      due: addDays(today, 1),
      interval: 1,
      reps: 0,
      lapses: card.lapses + 1,
      ease: Math.max(1.3, card.ease - 0.2),
    };
  } else {
    const interval =
      card.reps === 0 ? 1 : card.reps === 1 ? 3 : Math.round(card.interval * card.ease);
    map[id] = {
      ...card,
      due: addDays(today, interval),
      interval,
      reps: card.reps + 1,
      ease: Math.min(2.8, card.ease + 0.05),
    };
  }
  saveSrs(map);
}
