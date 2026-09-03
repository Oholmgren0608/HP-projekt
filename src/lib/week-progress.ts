import type { StudyTask, WeekPlan } from "@/lib/study-plan";
import { storageGet, storageSet } from "@/lib/sync/storage-sync";

export const WEEK_PROGRESS_KEY = "hp-studieplan-progress-v2";
export const WEEK_SCORES_KEY = "hp-studieplan-scores-v1";
export const WEEK_PROGRESS_EVENT = "hp-lift-week-progress";
export const LOCKED_WEEKS_KEY = "hp-lift-locked-weeks-v1";

export type ProgressMap = Record<string, boolean>;
export type ScoreMap = Record<string, { correct: number; total: number; at: string }>;

export function taskKey(week: number, taskId: string) {
  return `w${week}:${taskId}`;
}

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = storageGet(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadWeekProgress(): ProgressMap {
  return loadJson<ProgressMap>(WEEK_PROGRESS_KEY, {});
}

export function loadWeekScores(): ScoreMap {
  return loadJson<ScoreMap>(WEEK_SCORES_KEY, {});
}

export function emitWeekProgressChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WEEK_PROGRESS_EVENT));
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
  return loadJson<Record<number, WeekPlan>>(LOCKED_WEEKS_KEY, {});
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
