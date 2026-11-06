import { emitEvent, loadJson, saveJson } from "@/lib/storage";
import { addDays, currentPlanWeek, daysBetween, mondayOf, planWeekRange } from "@/lib/exam-date";
import type { StudyTask, WeekPlan } from "@/lib/study-plan";
import { taskKey, type ProgressMap } from "@/lib/week-progress";

/**
 * Pluggdagar: vilka veckodagar eleven pluggar (0 = måndag … 6 = söndag).
 * Veckans uppgifter fördelas på de dagarna i planens ordning, så att varje dag
 * får ungefär lika många minuter. Ingen uppgift delas mellan två dagar.
 */
export const STUDY_DAYS_KEY = "hp-lift-study-days-v1";
export const STUDY_DAYS_EVENT = "hp-lift-study-days";

/** Måndag–fredag tills eleven väljer själv. */
export const DEFAULT_STUDY_DAYS: readonly number[] = [0, 1, 2, 3, 4];

export const WEEKDAY_NAMES = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"] as const;
export const WEEKDAY_SHORT = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"] as const;

/** Sorterade, unika veckodagar 0–6, eller null om värdet är ogiltigt eller tomt. */
export function normalizeStudyDays(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const days = [...new Set(value.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  return days.length > 0 ? days : null;
}

export function loadStudyDays(): number[] {
  return normalizeStudyDays(loadJson<unknown>(STUDY_DAYS_KEY, null)) ?? [...DEFAULT_STUDY_DAYS];
}

export function saveStudyDays(days: readonly number[]): void {
  const normalized = normalizeStudyDays(days);
  if (!normalized) return;
  saveJson(STUDY_DAYS_KEY, normalized);
  emitEvent(STUDY_DAYS_EVENT);
}

export type DayBucket = { day: number; tasks: StudyTask[]; minutes: number };

/**
 * Fördelar uppgifterna på pluggdagarna. Varje uppgift hamnar på den dag där
 * dess mittpunkt ligger om veckans minuter läggs ut jämnt över dagarna. Då
 * behålls planens ordning och dagarna blir så jämna som hela uppgifter tillåter.
 */
export function distributeTasks(tasks: readonly StudyTask[], studyDays: readonly number[]): DayBucket[] {
  const days = normalizeStudyDays(studyDays) ?? [...DEFAULT_STUDY_DAYS];
  const buckets: DayBucket[] = days.map((day) => ({ day, tasks: [], minutes: 0 }));
  const total = tasks.reduce((sum, t) => sum + Math.max(0, t.minutes), 0);
  const perDay = total / buckets.length;
  let before = 0;
  tasks.forEach((task, i) => {
    const minutes = Math.max(0, task.minutes);
    const index =
      perDay > 0
        ? Math.min(buckets.length - 1, Math.floor((before + minutes / 2) / perDay))
        : Math.min(buckets.length - 1, Math.floor((i * buckets.length) / tasks.length));
    buckets[index].tasks.push(task);
    buckets[index].minutes += minutes;
    before += minutes;
  });
  return buckets;
}

/** Veckodagen för ett datum (0 = måndag). */
export function weekdayOf(date: string): number {
  return daysBetween(mondayOf(date), date);
}

export type TodayTask = { week: number; task: StudyTask; done: boolean };

export type TodayState =
  | { kind: "not-started"; startsOn: string }
  | { kind: "study-day"; date: string; week: number; tasks: TodayTask[]; openEarlier: number }
  | { kind: "rest-day"; date: string; week: number; openEarlier: number; next: { date: string; tasks: TodayTask[] } | null };

/**
 * Vad som gäller idag i veckoplanen. Kräver provdatum och planstart (steg 2).
 * `openEarlier` = uppgifter från tidigare dagar i veckan som inte är klara.
 */
export function todayInPlan(input: {
  weeklyPlans: readonly WeekPlan[];
  planStart: string;
  examDate: string;
  studyDays: readonly number[];
  progress: ProgressMap;
  today: string;
}): TodayState {
  const { weeklyPlans, planStart, examDate, progress, today } = input;
  const studyDays = normalizeStudyDays(input.studyDays) ?? [...DEFAULT_STUDY_DAYS];
  const week = currentPlanWeek(planStart, examDate, today);
  if (week === 0) return { kind: "not-started", startsOn: planWeekRange(planStart, 1).start };

  const toTodayTasks = (w: number, tasks: StudyTask[]) =>
    tasks.map((task) => ({ week: w, task, done: Boolean(progress[taskKey(w, task.id)]) }));
  const bucketsFor = (w: number) => {
    const plan = weeklyPlans.find((p) => p.week === w);
    return plan ? distributeTasks(plan.tasks, studyDays) : [];
  };

  const weekday = weekdayOf(today);
  const buckets = bucketsFor(week);
  const openEarlier = buckets
    .filter((b) => b.day < weekday)
    .reduce((sum, b) => sum + toTodayTasks(week, b.tasks).filter((t) => !t.done).length, 0);

  const todays = buckets.find((b) => b.day === weekday);
  if (todays && todays.tasks.length > 0) {
    return { kind: "study-day", date: today, week, tasks: toTodayTasks(week, todays.tasks), openEarlier };
  }

  // Vilodag: nästa dag med uppgifter, i den här veckan eller nästa.
  const weekStart = planWeekRange(planStart, week).start;
  const laterThisWeek = buckets.find((b) => b.day > weekday && b.tasks.length > 0);
  let next: { date: string; tasks: TodayTask[] } | null = null;
  if (laterThisWeek) {
    next = { date: addDays(weekStart, laterThisWeek.day), tasks: toTodayTasks(week, laterThisWeek.tasks) };
  } else {
    const first = bucketsFor(week + 1).find((b) => b.tasks.length > 0);
    if (first) next = { date: addDays(weekStart, 7 + first.day), tasks: toTodayTasks(week + 1, first.tasks) };
  }
  return { kind: "rest-day", date: today, week, openEarlier, next };
}
