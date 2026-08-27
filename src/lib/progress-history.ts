import { clampNorm, type ScoreInput } from "@/lib/hp-scores";
import type { PracticeKind } from "@/lib/practice";

export const HISTORY_STORAGE_KEY = "hp-lift-history-v1";
export const HISTORY_EVENT = "hp-lift-history-changed";

export type QuizSource = "week" | "mock";

export type QuizHistoryEvent = {
  type: "quiz";
  at: string;
  source: QuizSource;
  kinds: string[];
  correct: number;
  total: number;
  estimatedNorm: number;
};

export type ScoresHistoryEvent = {
  type: "scores";
  at: string;
  quantNorm: number;
  verbalNorm: number;
  overall: number;
};

export type HistoryEvent = QuizHistoryEvent | ScoresHistoryEvent;

const QUANT_KINDS = new Set(["dtk", "xyz", "kva", "nog"]);
const VERBAL_KINDS = new Set(["ord", "mek", "las", "elf"]);

function emitHistoryChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function loadHistory(): HistoryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(events: HistoryEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(events.slice(-80)));
  emitHistoryChanged();
}

/** Rough mapping from raw percent to HP-style 0,0–2,0. Not UHR's official table. */
export function estimateNormFromPercent(percent: number): number {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const n = Math.pow(p, 0.82) * 2.08 - 0.12;
  return clampNorm(n);
}

export function appendQuizResult(input: {
  source: QuizSource;
  kinds: PracticeKind[];
  correct: number;
  total: number;
}) {
  const total = Math.max(0, input.total);
  const percent = total ? (input.correct / total) * 100 : 0;
  const events = loadHistory();
  events.push({
    type: "quiz",
    at: new Date().toISOString(),
    source: input.source,
    kinds: input.kinds.filter((k) => k !== "reflect"),
    correct: input.correct,
    total,
    estimatedNorm: estimateNormFromPercent(percent),
  });
  saveHistory(events);
}

export function appendScoreSnapshot(scores: ScoreInput) {
  const overall =
    Math.round(((scores.quantNorm + scores.verbalNorm) / 2) * 100) / 100;
  const events = loadHistory();
  const last = [...events].reverse().find((e) => e.type === "scores");
  if (
    last &&
    last.quantNorm === scores.quantNorm &&
    last.verbalNorm === scores.verbalNorm
  ) {
    return;
  }
  events.push({
    type: "scores",
    at: new Date().toISOString(),
    quantNorm: scores.quantNorm,
    verbalNorm: scores.verbalNorm,
    overall,
  });
  saveHistory(events);
}

export function ensureScoreBaseline(scores: ScoreInput) {
  if (loadHistory().some((e) => e.type === "scores")) return;
  appendScoreSnapshot(scores);
}

export function rollingQuizPercent(
  events: HistoryEvent[],
  block: "verbal" | "quant" | "all",
): { percent: number; n: number } | null {
  const quizzes = events.filter((e): e is QuizHistoryEvent => e.type === "quiz");
  const recent = quizzes.slice(-16);
  let correct = 0;
  let total = 0;
  for (const q of recent) {
    if (q.total <= 0) continue;
    const kinds = q.kinds;
    const match =
      block === "all" ||
      kinds.some((k) =>
        block === "quant" ? QUANT_KINDS.has(k) : VERBAL_KINDS.has(k),
      );
    if (!match) continue;
    correct += q.correct;
    total += q.total;
  }
  if (total < 4) return null;
  return { percent: Math.round((correct / total) * 100), n: total };
}

export function chartPoints(events: HistoryEvent[]): { at: string; value: number; label: string }[] {
  const points: { at: string; value: number; label: string }[] = [];
  for (const e of events) {
    if (e.type === "scores") {
      points.push({ at: e.at, value: e.overall, label: "inmatad" });
    } else if (e.total >= 4) {
      points.push({ at: e.at, value: e.estimatedNorm, label: "övning" });
    }
  }
  return points.slice(-12);
}

export function shouldSuggestNewPlan(savedOverall: number, events: HistoryEvent[]): boolean {
  const rolling = rollingQuizPercent(events, "all");
  if (!rolling) return false;
  const estimated = estimateNormFromPercent(rolling.percent);
  return Math.abs(estimated - savedOverall) >= 0.2;
}
