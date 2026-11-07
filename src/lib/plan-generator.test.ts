import { describe, expect, it } from "vitest";
import { generatePlan } from "./plan-generator";
import { DEFAULT_SCORES } from "./hp-scores";
import type { WeekPlan } from "./study-plan";

describe("generatePlan", () => {
  it("bygger planen bara från resultatet (ingen övningstrend sedan 2026-11-07)", () => {
    const a = generatePlan(DEFAULT_SCORES);
    const b = generatePlan(DEFAULT_SCORES, { lockedWeeks: {} });
    expect(b.weeklyPlans).toEqual(a.weeklyPlans);
    expect(b.focusIds).toEqual(a.focusIds);
    expect(a).not.toHaveProperty("adaptedFromPractice");
  });

  it("påbörjade veckor behåller sitt låsta snapshot när planen byggs om", () => {
    const fresh = generatePlan(DEFAULT_SCORES);
    const week2 = fresh.weeklyPlans[1];
    const locked: WeekPlan = { ...week2, theme: "Låst vecka", tasks: week2.tasks.slice(0, 1) };

    const rebuilt = generatePlan(DEFAULT_SCORES, { lockedWeeks: { [week2.week]: locked } });

    expect(rebuilt.weeklyPlans[1]).toBe(locked);
    expect(rebuilt.weeklyPlans[0]).toEqual(fresh.weeklyPlans[0]);
    expect(rebuilt.weeklyPlans).toHaveLength(fresh.weeklyPlans.length);
  });
});
