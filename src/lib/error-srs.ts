import { findQuestionById, type ChoiceQuestion } from "@/lib/practice";

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
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SRS_EVENT));
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

function hydrateCard(card: SrsCard): SrsCard {
  const needsPassage = !card.passage;
  const needsOptions = !card.options?.length;
  if (!needsPassage && !needsOptions) return card;
  const q = findQuestionById(card.id);
  if (!q) return card;
  const next: SrsCard = { ...card };
  if (needsPassage && q.passage) next.passage = q.passage;
  if (needsOptions && q.options.length) next.options = q.options;
  return next;
}

export function loadSrs(): Record<string, SrsCard> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SrsCard>;
    if (!parsed || typeof parsed !== "object") return {};
    let changed = false;
    const hydrated: Record<string, SrsCard> = {};
    for (const [id, card] of Object.entries(parsed)) {
      const next = hydrateCard(card);
      if ((next.passage && !card.passage) || (next.options?.length && !card.options?.length)) {
        changed = true;
      }
      hydrated[id] = next;
    }
    if (changed) {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(hydrated));
    }
    return hydrated;
  } catch {
    return {};
  }
}

function saveSrs(map: Record<string, SrsCard>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(map));
  emitSrsChanged();
}

export function dueCards(map = loadSrs()): SrsCard[] {
  const today = localDateKey();
  return Object.values(map)
    .filter((c) => toLocalDateKey(c.due) <= today)
    .sort((a, b) => toLocalDateKey(a.due).localeCompare(toLocalDateKey(b.due)));
}

export function dueCount(): number {
  return dueCards().length;
}

export function recordMissedQuestions(questions: ChoiceQuestion[], answers: Record<string, number>) {
  const map = loadSrs();
  const today = localDateKey();
  for (const q of questions) {
    const chosen = answers[q.id];
    if (chosen === q.correctIndex) continue;
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
