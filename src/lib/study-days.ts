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

export type TodayTask = {
  week: number;
  task: StudyTask;
  done: boolean;
  /** Veckodagen uppgiften flyttades från, när den inte hanns med då. */
  movedFrom: number | null;
};

export type ScheduledDay = { day: number; items: TodayTask[] };
export type WeekSchedule = {
  days: ScheduledDay[];
  /** Uppgifter som inte får plats längre den här veckan (lägst prioritet först bort). */
  dropped: TodayTask[];
};

/**
 * Veckans schema med hänsyn till vad som redan är gjort.
 *
 * Utan `weekday` (en vecka som inte är den aktuella) är det den vanliga
 * fördelningen. För den aktuella veckan flyttas uppgifter som inte gjordes på
 * sin dag till nästa pluggdag med plats. En dag tar högst ~25 % mer än veckans
 * snitt per dag (minst en uppgift), så missade pass staplas inte: får något
 * inte plats krymper veckan och de sista uppgifterna i planens ordning, alltså
 * de med lägst prioritet, hamnar i `dropped`. De kan fortfarande göras.
 */
export function scheduleWeek(input: {
  tasks: readonly StudyTask[];
  week: number;
  studyDays: readonly number[];
  progress: ProgressMap;
  /** Dagens veckodag om veckan är den aktuella, annars null. */
  weekday: number | null;
}): WeekSchedule {
  const { tasks, week, progress, weekday } = input;
  const buckets = distributeTasks(tasks, input.studyDays);
  const item = (task: StudyTask, movedFrom: number | null = null): TodayTask => ({
    week,
    task,
    done: Boolean(progress[taskKey(week, task.id)]),
    movedFrom,
  });

  if (weekday === null) {
    return { days: buckets.map((b) => ({ day: b.day, items: b.tasks.map((t) => item(t)) })), dropped: [] };
  }

  const total = tasks.reduce((sum, t) => sum + Math.max(0, t.minutes), 0);
  const perDay = total / Math.max(1, buckets.length);
  const largest = tasks.reduce((max, t) => Math.max(max, t.minutes), 0);
  const capacity = Math.max(perDay * 1.25, largest);

  const days: ScheduledDay[] = buckets.map((b) => ({ day: b.day, items: [] }));
  const used = new Map<number, number>(buckets.map((b) => [b.day, 0]));
  const originalDay = new Map<string, number>();
  for (const b of buckets) for (const t of b.tasks) originalDay.set(t.id, b.day);

  // Gjorda uppgifter står kvar på sin dag och tar ingen tid.
  for (const b of buckets) {
    const dayItems = days.find((d) => d.day === b.day)!.items;
    for (const t of b.tasks) if (item(t).done) dayItems.push(item(t));
  }

  // Ogjorda uppgifter i planens ordning: tidigast på sin egen dag, och aldrig
  // på en dag som redan har passerat.
  const remaining = buckets.map((b) => b.day).filter((d) => d >= weekday);
  const dropped: TodayTask[] = [];
  for (const t of tasks) {
    if (item(t).done) continue;
    const own = originalDay.get(t.id) ?? weekday;
    const earliest = Math.max(own, weekday);
    const target = remaining.find(
      (d) => d >= earliest && ((used.get(d) ?? 0) + t.minutes <= capacity || (used.get(d) ?? 0) === 0),
    );
    if (target === undefined) {
      dropped.push(item(t, own < weekday ? own : null));
      continue;
    }
    used.set(target, (used.get(target) ?? 0) + t.minutes);
    days.find((d) => d.day === target)!.items.push(item(t, target !== own ? own : null));
  }
  // Inom en dag: i planens ordning.
  const order = new Map(tasks.map((t, i) => [t.id, i]));
  for (const d of days) d.items.sort((a, b) => (order.get(a.task.id) ?? 0) - (order.get(b.task.id) ?? 0));
  return { days, dropped };
}

export type TodayState =
  | { kind: "not-started"; startsOn: string }
  | { kind: "study-day"; date: string; week: number; tasks: TodayTask[]; dropped: number }
  | { kind: "rest-day"; date: string; week: number; dropped: number; next: { date: string; tasks: TodayTask[] } | null };

/**
 * Vad som gäller idag i veckoplanen. Kräver provdatum och planstart (steg 2).
 * Uppgifter som inte hanns med tidigare i veckan ligger med i dagens eller
 * nästa pluggdags lista (scheduleWeek); `dropped` = uppgifter som inte längre
 * får plats den här veckan.
 */
export function todayInPlan(input: {
  weeklyPlans: readonly WeekPlan[];
  planStart: string;
  examDate: string;
  studyDays: readonly number[];
  progress: ProgressMap;
  today: string;
}): TodayState {
  const { weeklyPlans, planStart, examDate, progress, today, studyDays } = input;
  const week = currentPlanWeek(planStart, examDate, today);
  if (week === 0) return { kind: "not-started", startsOn: planWeekRange(planStart, 1).start };

  const weekday = weekdayOf(today);
  const scheduleFor = (w: number, current: boolean) => {
    const plan = weeklyPlans.find((p) => p.week === w);
    return plan
      ? scheduleWeek({ tasks: plan.tasks, week: w, studyDays, progress, weekday: current ? weekday : null })
      : { days: [], dropped: [] };
  };

  const schedule = scheduleFor(week, true);
  const dropped = schedule.dropped.length;
  const todays = schedule.days.find((d) => d.day === weekday);
  if (todays && todays.items.length > 0) {
    return { kind: "study-day", date: today, week, tasks: todays.items, dropped };
  }

  // Vilodag: nästa dag med ogjorda uppgifter, i den här veckan eller nästa.
  const weekStart = planWeekRange(planStart, week).start;
  const laterThisWeek = schedule.days.find((d) => d.day > weekday && d.items.some((i) => !i.done));
  let next: { date: string; tasks: TodayTask[] } | null = null;
  if (laterThisWeek) {
    next = { date: addDays(weekStart, laterThisWeek.day), tasks: laterThisWeek.items };
  } else {
    const first = scheduleFor(week + 1, false).days.find((d) => d.items.length > 0);
    if (first) next = { date: addDays(weekStart, 7 + first.day), tasks: first.items };
  }
  return { kind: "rest-day", date: today, week, dropped, next };
}
