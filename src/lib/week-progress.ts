import type { PracticeKind } from "@/lib/practice";
import type { SectionId, StudyTask, WeekPlan } from "@/lib/study-plan";
import { storageSet } from "@/lib/sync/storage-sync";
import { emitEvent, loadJson } from "@/lib/storage";

// Bakåtkompatibel re-export (main/PR#4): loadJson bor numera i @/lib/storage.
export { loadJson };

export const WEEK_PROGRESS_KEY = "hp-studieplan-progress-v2";
export const WEEK_SCORES_KEY = "hp-studieplan-scores-v1";
export const WEEK_PROGRESS_EVENT = "hp-lift-week-progress";
export const LOCKED_WEEKS_KEY = "hp-lift-locked-weeks-v1";

export type ProgressMap = Record<string, boolean>;
export type ScoreMap = Record<string, { correct: number; total: number; at: string }>;

export function taskKey(week: number, taskId: string) {
  return `w${week}:${taskId}`;
}

/**
 * Läser en JSON-nyckel via den delade loadJson (SSR-guard, saknad nyckel och
 * JSON-fel hanteras där) och normaliserar resultatet. Detta ersätter den
 * tidigare lokala kopian av loadJson så att ingen okontrollerad `as T`-cast
 * ligger kvar på vecko-progressens läsvägar.
 */
function loadNormalized<T>(
  key: string,
  fallback: T,
  normalize: (value: unknown) => T,
): T {
  return normalize(loadJson<unknown>(key, fallback));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Bygger en giltig veckoplan av ett okänt värde, annars null. */
function toWeekPlan(value: unknown): WeekPlan | null {
  if (!isRecord(value)) return null;
  const week = toFiniteNumber(value.week);
  if (
    week === null ||
    typeof value.phase !== "string" ||
    typeof value.theme !== "string" ||
    typeof value.focus !== "string" ||
    !Array.isArray(value.tasks)
  ) {
    return null;
  }
  const tasks: StudyTask[] = [];
  for (const task of value.tasks) {
    if (!isRecord(task)) return null;
    const minutes = toFiniteNumber(task.minutes);
    if (
      typeof task.id !== "string" ||
      typeof task.title !== "string" ||
      typeof task.detail !== "string" ||
      minutes === null ||
      typeof task.section !== "string" ||
      !Array.isArray(task.practiceKinds)
    ) {
      return null;
    }
    const questionCount = toFiniteNumber(task.questionCount);
    tasks.push({
      id: task.id,
      title: task.title,
      detail: task.detail,
      minutes,
      section: task.section as SectionId,
      practiceKinds: task.practiceKinds as PracticeKind[],
      ...(questionCount === null ? {} : { questionCount }),
    });
  }
  return {
    week,
    phase: value.phase,
    theme: value.theme,
    focus: value.focus,
    tasks,
  };
}

/** Normaliserar lagrad progress: bara `true`/`false`-värden behålls. */
export function loadWeekProgress(): ProgressMap {
  return loadNormalized<ProgressMap>(WEEK_PROGRESS_KEY, {}, (parsed) => {
    if (!isRecord(parsed)) return {};
    const out: ProgressMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  });
}

/** Normaliserar lagrade resultat: bara poster med numerisk correct/total behålls. */
export function loadWeekScores(): ScoreMap {
  return loadNormalized<ScoreMap>(WEEK_SCORES_KEY, {}, (parsed) => {
    if (!isRecord(parsed)) return {};
    const out: ScoreMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isRecord(value)) continue;
      const correct = toFiniteNumber(value.correct);
      const total = toFiniteNumber(value.total);
      if (correct === null || total === null) continue;
      out[key] = {
        correct,
        total,
        at: typeof value.at === "string" ? value.at : "",
      };
    }
    return out;
  });
}

export function emitWeekProgressChanged() {
  emitEvent(WEEK_PROGRESS_EVENT);
}

export function findNextIncomplete(
  weeklyPlans: WeekPlan[],
  progress: ProgressMap,
): { week: number; task: StudyTask } | null {
  for (const w of weeklyPlans) {
    for (const t of w.tasks) {
      if (!progress[taskKey(w.week, t.id)]) {
        return { week: w.week, task: t };
      }
    }
  }
  return null;
}

/** Nästa ofärdiga uppgift efter den aktuella: resten av veckan först, annars findNextIncomplete. */
export function findNextIncompleteAfter(
  weeklyPlans: WeekPlan[],
  progress: ProgressMap,
  currentWeek: number,
  currentTaskId: string,
): { week: number; task: StudyTask } | null {
  const currentPlan = weeklyPlans.find((w) => w.week === currentWeek);
  if (currentPlan) {
    const idx = currentPlan.tasks.findIndex((t) => t.id === currentTaskId);
    if (idx >= 0) {
      for (const task of currentPlan.tasks.slice(idx + 1)) {
        if (!progress[taskKey(currentWeek, task.id)]) {
          return { week: currentWeek, task };
        }
      }
    }
  }
  const skipCurrent: ProgressMap = {
    ...progress,
    [taskKey(currentWeek, currentTaskId)]: true,
  };
  return findNextIncomplete(weeklyPlans, skipCurrent);
}

export function weekProgressSummary(weeklyPlans: WeekPlan[], progress: ProgressMap) {
  const allTasks = weeklyPlans.flatMap((w) => w.tasks.map((t) => taskKey(w.week, t.id)));
  const done = allTasks.filter((k) => progress[k]).length;
  return {
    done,
    total: allTasks.length,
    percent: allTasks.length ? Math.round((done / allTasks.length) * 100) : 0,
  };
}

export function startedWeekNumbers(progress: ProgressMap): number[] {
  const weeks = new Set<number>();
  for (const key of Object.keys(progress)) {
    if (!progress[key]) continue;
    const match = /^w(\d+):/.exec(key);
    if (match) weeks.add(Number(match[1]));
  }
  return [...weeks];
}

export function loadLockedWeeks(): Record<number, WeekPlan> {
  return loadNormalized<Record<number, WeekPlan>>(LOCKED_WEEKS_KEY, {}, (parsed) => {
    if (!isRecord(parsed)) return {};
    const out: Record<number, WeekPlan> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const week = Number(key);
      if (!Number.isInteger(week) || week <= 0) continue;
      const plan = toWeekPlan(value);
      if (!plan) continue;
      out[week] = plan;
    }
    return out;
  });
}

export function saveLockedWeekIfAbsent(weekPlan: WeekPlan) {
  if (typeof window === "undefined") return;
  const locked = loadLockedWeeks();
  if (locked[weekPlan.week]) return;
  locked[weekPlan.week] = weekPlan;
  storageSet(LOCKED_WEEKS_KEY, JSON.stringify(locked));
  emitWeekProgressChanged();
}

export function clearLockedWeek(week: number) {
  if (typeof window === "undefined") return;
  const locked = loadLockedWeeks();
  if (!locked[week]) return;
  delete locked[week];
  storageSet(LOCKED_WEEKS_KEY, JSON.stringify(locked));
  emitWeekProgressChanged();
}
