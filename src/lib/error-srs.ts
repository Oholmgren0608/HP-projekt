import type { ChoiceQuestion } from "@/lib/practice";

export const SRS_STORAGE_KEY = "hp-lift-srs-v1";
export const SRS_EVENT = "hp-lift-srs-changed";

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
};

function emitSrsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SRS_EVENT));
}

export function loadSrs(): Record<string, SrsCard> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SrsCard>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSrs(map: Record<string, SrsCard>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(map));
  emitSrsChanged();
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dueCards(map = loadSrs()): SrsCard[] {
  const today = startOfToday();
  return Object.values(map)
    .filter((c) => {
      const due = new Date(c.due);
      due.setHours(0, 0, 0, 0);
      return due.getTime() <= today;
    })
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
}

export function dueCount(): number {
  return dueCards().length;
}

export function recordMissedQuestions(questions: ChoiceQuestion[], answers: Record<string, number>) {
  const map = loadSrs();
  const now = new Date().toISOString();
  for (const q of questions) {
    const chosen = answers[q.id];
    if (chosen === undefined || chosen === q.correctIndex) continue;
    const existing = map[q.id];
    map[q.id] = {
      id: q.id,
      front: q.prompt,
      back: q.options[q.correctIndex],
      explain: q.explain,
      kind: q.kind,
      due: addDays(now, 0),
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
  const now = new Date().toISOString();
  if (!remembered) {
    map[id] = {
      ...card,
      due: addDays(now, 1),
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
      due: addDays(now, interval),
      interval,
      reps: card.reps + 1,
      ease: Math.min(2.8, card.ease + 0.05),
    };
  }
  saveSrs(map);
}
