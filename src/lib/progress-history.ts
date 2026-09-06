import { clampNorm, type ScoreInput } from "@/lib/hp-scores";
import type { ChoiceQuestion, PracticeKind } from "@/lib/practice";
import { tallyByKind, type KindTally } from "@/lib/quiz";
import { storageSet } from "@/lib/sync/storage-sync";
import { emitEvent, loadJson } from "@/lib/storage";

export type { KindTally };

export const HISTORY_STORAGE_KEY = "hp-lift-history-v1";
export const HISTORY_EVENT = "hp-lift-history-changed";

/**
 * Minsta antal besvarade frågor i ett delprov innan det räknas in i
 * poängprognosen. Likt andra HP-appar vill vi ha mer data per delprov innan
 * siffran rör sig — testas med 10 som startvärde.
 */
export const PROGNOSIS_MIN_KIND_QUESTIONS = 10;

export type QuizSource = "week" | "mock" | "free" | "nivatest";

export type QuizHistoryEvent = {
  type: "quiz";
  at: string;
  source: QuizSource;
  kinds: string[];
  correct: number;
  total: number;
  estimatedNorm: number;
  /**
   * Rätt/total per delprov för passet. Äldre händelser (före den här
   * funktionen) saknar fältet; då delas totalen proportionellt över
   * `kinds` istället.
   */
  perKind?: Record<string, KindTally>;
  /** Active time for the pass, when known */
  durationMs?: number;
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
  emitEvent(HISTORY_EVENT);
}

export function loadHistory(): HistoryEvent[] {
  const parsed = loadJson<HistoryEvent[]>(HISTORY_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveHistory(events: HistoryEvent[]) {
  if (typeof window === "undefined") return;
  storageSet(HISTORY_STORAGE_KEY, JSON.stringify(events.slice(-80)));
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
  perKind?: Record<string, KindTally>;
  durationMs?: number;
}) {
  const total = Math.max(0, input.total);
  const percent = total ? (input.correct / total) * 100 : 0;
  const kinds = input.kinds.filter((k) => k !== "reflect");
  const perKind = input.perKind
    ? Object.fromEntries(
        Object.entries(input.perKind).filter(([k]) =>
          kinds.includes(k as (typeof kinds)[number]),
        ),
      )
    : undefined;
  const events = loadHistory();
  events.push({
    type: "quiz",
    at: new Date().toISOString(),
    source: input.source,
    kinds,
    correct: input.correct,
    total,
    estimatedNorm: estimateNormFromPercent(percent),
    perKind: perKind && Object.keys(perKind).length > 0 ? perKind : undefined,
    durationMs: input.durationMs && input.durationMs > 0 ? input.durationMs : undefined,
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

/** Rätt/total per delprov utifrån en låst svarskopia. */
export function tallyPerKind(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
): Record<string, KindTally> {
  return tallyByKind(questions, answers);
}

function addQuizToStats(map: Map<string, KindTally>, e: QuizHistoryEvent) {
  if (e.total <= 0) return;
  if (e.perKind) {
    for (const [kind, row] of Object.entries(e.perKind)) {
      const cur = map.get(kind) ?? { correct: 0, total: 0 };
      cur.correct += row.correct;
      cur.total += row.total;
      map.set(kind, cur);
    }
    return;
  }
  // Äldre händelser utan perKind: dela proportionellt så att totalen bevaras.
  const kinds = e.kinds.filter((k) => k !== "reflect");
  if (kinds.length === 0) return;
  const per = e.total / kinds.length;
  const correctPer = e.correct / kinds.length;
  for (const kind of kinds) {
    const cur = map.get(kind) ?? { correct: 0, total: 0 };
    cur.correct += correctPer;
    cur.total += per;
    map.set(kind, cur);
  }
}

function qualifyingKindsTotal(map: Map<string, KindTally>): {
  correct: number;
  total: number;
  kinds: number;
} {
  let correct = 0;
  let total = 0;
  let kinds = 0;
  for (const row of map.values()) {
    if (row.total >= PROGNOSIS_MIN_KIND_QUESTIONS) {
      correct += row.correct;
      total += row.total;
      kinds += 1;
    }
  }
  return { correct, total, kinds };
}

/** Ackumulerad rätt/total per delprov över alla quiz-händelser. */
export function cumulativeKindStats(
  events: readonly HistoryEvent[],
): Map<string, KindTally> {
  const map = new Map<string, KindTally>();
  for (const e of events) {
    if (e.type === "quiz") addQuizToStats(map, e);
  }
  return map;
}

export type ExercisePrognosis = {
  /** Andel rätt (0–100) över alla delprov som nått tröskeln. */
  percent: number;
  /** Antal frågor som prognosen baseras på. */
  n: number;
  /** Ackumulerad rätt/total per delprov (även under tröskeln). */
  byKind: Record<string, KindTally>;
  /** Delprov som nått minst PROGNOSIS_MIN_KIND_QUESTIONS besvarade frågor. */
  qualifyingKinds: string[];
};

/**
 * Poängprognos från övningar. Rör sig bara när minst
 * PROGNOSIS_MIN_KIND_QUESTIONS frågor besvarats i ett delprov — färre svar
 * räknas inte in, så siffran blir stabilare ju mer data som finns.
 */
export function prognosisFromExercises(
  events: readonly HistoryEvent[],
): ExercisePrognosis | null {
  const stats = cumulativeKindStats(events);
  const qualifyingKinds: string[] = [];
  let correct = 0;
  let total = 0;
  for (const [kind, row] of stats) {
    if (row.total >= PROGNOSIS_MIN_KIND_QUESTIONS) {
      qualifyingKinds.push(kind);
      correct += row.correct;
      total += row.total;
    }
  }
  if (total === 0 || qualifyingKinds.length === 0) return null;
  return {
    percent: Math.round((correct / total) * 100),
    n: total,
    byKind: Object.fromEntries(stats),
    qualifyingKinds,
  };
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
  const running = new Map<string, KindTally>();
  for (const e of events) {
    if (e.type === "scores") {
      points.push({ at: e.at, value: e.overall, label: "inmatad" });
      continue;
    }
    addQuizToStats(running, e);
    const q = qualifyingKindsTotal(running);
    // Prognospunkter läggs bara till när något delprov nått tröskeln.
    if (q.total > 0) {
      points.push({
        at: e.at,
        value: estimateNormFromPercent(Math.round((q.correct / q.total) * 100)),
        label: "övning",
      });
    }
  }
  return points.slice(-12);
}

export function shouldSuggestNewPlan(savedOverall: number, events: HistoryEvent[]): boolean {
  const prognosis = prognosisFromExercises(events);
  if (!prognosis) return false;
  const estimated = estimateNormFromPercent(prognosis.percent);
  return Math.abs(estimated - savedOverall) >= 0.2;
}

export function rollingPace(events: HistoryEvent[]): {
  secPerQ: number;
  n: number;
} | null {
  const timed = events.filter(
    (e): e is QuizHistoryEvent =>
      e.type === "quiz" && typeof e.durationMs === "number" && e.durationMs > 0 && e.total > 0,
  );
  const recent = timed.slice(-12);
  let ms = 0;
  let questions = 0;
  for (const q of recent) {
    ms += q.durationMs ?? 0;
    questions += q.total;
  }
  if (questions < 4) return null;
  return { secPerQ: ms / 1000 / questions, n: questions };
}
