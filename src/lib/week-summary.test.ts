import { describe, expect, it } from "vitest";
import { estimateNormFromPercent, type HistoryEvent } from "./progress-history";
import type { StudyTask, WeekPlan } from "./study-plan";
import { weekSummary } from "./week-summary";

const task = (id: string): StudyTask => ({ id, title: id, detail: "", minutes: 60, section: "ORD", practiceKinds: ["ord"] });
const plan = (week: number): WeekPlan => ({ week, phase: "Bas", theme: `Tema ${week}`, focus: `Fokus ${week}`, tasks: [task("a"), task("b"), task("c")] });
const quiz = (at: string, correct: number, total: number): HistoryEvent => ({
  type: "quiz",
  at,
  source: "week",
  kinds: ["ord"],
  correct,
  total,
  estimatedNorm: 1,
  perKind: { ord: { correct, total } },
});

describe("weekSummary", () => {
  const history = [
    quiz("2026-10-28T10:00:00Z", 5, 10), // veckan före
    quiz("2026-11-03T10:00:00Z", 8, 10), // tisdag
    quiz("2026-11-08T10:00:00Z", 9, 10), // söndag
    quiz("2026-11-10T10:00:00Z", 1, 10), // nästa vecka, räknas inte
  ];

  it("räknar veckans pass, frågor och andel rätt", () => {
    const s = weekSummary({
      weekPlan: plan(1),
      nextWeekPlan: plan(2),
      progress: { "w1:a": true, "w1:c": true },
      history,
      weekStart: "2026-11-02",
    });
    expect(s).toMatchObject({ week: 1, tasksDone: 2, tasksTotal: 3, questions: 20, correctPercent: 85 });
    expect(s.next).toEqual({ week: 2, theme: "Tema 2", focus: "Fokus 2" });
  });

  it("visar hur prognosen har rört sig med de befintliga funktionerna", () => {
    const s = weekSummary({ weekPlan: plan(1), nextWeekPlan: null, progress: {}, history, weekStart: "2026-11-02" });
    expect(s.normBefore).toBe(estimateNormFromPercent(50)); // 5/10 före veckan
    expect(s.normNow).toBe(estimateNormFromPercent(73)); // 22/30 t.o.m. söndag
    expect(s.next).toBeNull();
  });

  it("klarar en vecka utan övning", () => {
    const s = weekSummary({ weekPlan: plan(1), nextWeekPlan: plan(2), progress: {}, history: [], weekStart: "2026-11-02" });
    expect(s).toMatchObject({ questions: 0, correctPercent: null, normBefore: null, normNow: null, tasksDone: 0 });
  });
});
