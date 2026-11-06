import { addDays, todayKey } from "@/lib/exam-date";
import { estimateNormFromPercent, prognosisFromExercises, type HistoryEvent } from "@/lib/progress-history";
import type { WeekPlan } from "@/lib/study-plan";
import { taskKey, type ProgressMap } from "@/lib/week-progress";

/**
 * Veckoavstämningen som visas på söndagen: hur veckan gick, hur prognosen har
 * rört sig och vad nästa vecka handlar om. Prognosen räknas med de befintliga
 * funktionerna i progress-history.ts (AGENTS.md §6) — på historiken före veckan
 * och på historiken nu.
 */
export type WeekSummary = {
  week: number;
  tasksDone: number;
  tasksTotal: number;
  /** Besvarade frågor och andel rätt under veckan (måndag–söndag). */
  questions: number;
  correctPercent: number | null;
  /** Uppskattad normerad poäng före veckan och nu, eller null utan underlag. */
  normBefore: number | null;
  normNow: number | null;
  next: { week: number; theme: string; focus: string } | null;
};

/** Händelsens datum i lokal kalender ("YYYY-MM-DD"). */
function localDate(at: string): string {
  return todayKey(new Date(at));
}

export function weekSummary(input: {
  weekPlan: WeekPlan;
  nextWeekPlan: WeekPlan | null;
  progress: ProgressMap;
  history: readonly HistoryEvent[];
  /** Veckans måndag, "YYYY-MM-DD". */
  weekStart: string;
}): WeekSummary {
  const { weekPlan, nextWeekPlan, progress, history, weekStart } = input;
  const weekEnd = addDays(weekStart, 6);

  const tasksDone = weekPlan.tasks.filter((t) => progress[taskKey(weekPlan.week, t.id)]).length;

  let questions = 0;
  let correct = 0;
  for (const e of history) {
    if (e.type !== "quiz") continue;
    const day = localDate(e.at);
    if (day < weekStart || day > weekEnd) continue;
    questions += e.total;
    correct += e.correct;
  }

  const before = prognosisFromExercises(history.filter((e) => localDate(e.at) < weekStart));
  const now = prognosisFromExercises(history.filter((e) => localDate(e.at) <= weekEnd));

  return {
    week: weekPlan.week,
    tasksDone,
    tasksTotal: weekPlan.tasks.length,
    questions,
    correctPercent: questions > 0 ? Math.round((correct / questions) * 100) : null,
    normBefore: before ? estimateNormFromPercent(before.percent) : null,
    normNow: now ? estimateNormFromPercent(now.percent) : null,
    next: nextWeekPlan
      ? { week: nextWeekPlan.week, theme: nextWeekPlan.theme, focus: nextWeekPlan.focus }
      : null,
  };
}
