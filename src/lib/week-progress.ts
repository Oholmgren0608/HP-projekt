import type { StudyTask, WeekPlan } from "@/lib/study-plan";

export const WEEK_PROGRESS_KEY = "hp-studieplan-progress-v2";
export const WEEK_SCORES_KEY = "hp-studieplan-scores-v1";
export const WEEK_PROGRESS_EVENT = "hp-lift-week-progress";

export type ProgressMap = Record<string, boolean>;
export type ScoreMap = Record<string, { correct: number; total: number; at: string }>;

export function taskKey(week: number, taskId: string) {
  return `w${week}:${taskId}`;
}

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
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

export function weekProgressSummary(weeklyPlans: WeekPlan[], progress: ProgressMap) {
  const allTasks = weeklyPlans.flatMap((w) => w.tasks.map((t) => taskKey(w.week, t.id)));
  const done = allTasks.filter((k) => progress[k]).length;
  return {
    done,
    total: allTasks.length,
    percent: allTasks.length ? Math.round((done / allTasks.length) * 100) : 0,
  };
}
