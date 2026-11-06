import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPlanPreview, hasStoredSession, planAccess } from "./plan-access";
import { generatePlan } from "./plan-generator";
import { DEFAULT_SCORES } from "./hp-scores";
import type { WeekPlan } from "./study-plan";

const base = { supabaseConfigured: true, authLoading: false, signedIn: false, storedSession: false };

describe("planAccess", () => {
  it("visar hela planen för inloggade", () => {
    expect(planAccess({ ...base, signedIn: true })).toBe("full");
  });
  it("visar förhandsvisningen för gäster", () => {
    expect(planAccess(base)).toBe("preview");
  });
  it("väntar medan inloggningen laddas", () => {
    expect(planAccess({ ...base, authLoading: true })).toBe("loading");
  });
  it("släpper in den som har en sparad session, även offline med utgången token", () => {
    expect(planAccess({ ...base, authLoading: true, storedSession: true })).toBe("full");
    expect(planAccess({ ...base, storedSession: true })).toBe("full");
  });
  it("visar hela planen när Supabase inte är konfigurerat (inga konton finns)", () => {
    expect(planAccess({ ...base, supabaseConfigured: false })).toBe("full");
  });
});

describe("hasStoredSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  const stub = (value: string | null) =>
    vi.stubGlobal("localStorage", { getItem: (key: string) => (key === "hp-lift-auth" ? value : null) });

  it("känner igen en sparad session", () => {
    stub(JSON.stringify({ access_token: "a", refresh_token: "r", user: { id: "u1" } }));
    expect(hasStoredSession()).toBe(true);
  });
  it("ignorerar saknad, trasig eller ofullständig session", () => {
    stub(null);
    expect(hasStoredSession()).toBe(false);
    stub("{inte json");
    expect(hasStoredSession()).toBe(false);
    stub(JSON.stringify({ access_token: "a" }));
    expect(hasStoredSession()).toBe(false);
  });
});

describe("buildPlanPreview", () => {
  it("visar vecka 1 i sin helhet och bara rubriker för resten", () => {
    const plan = generatePlan(DEFAULT_SCORES);
    const preview = buildPlanPreview(plan.weeklyPlans);
    expect(preview).not.toBeNull();
    expect(preview!.firstWeek).toEqual(plan.weeklyPlans[0]);
    expect(preview!.lockedWeeks).toHaveLength(plan.weeklyPlans.length - 1);
    expect(preview!.lockedWeeks[0]).toEqual({
      week: plan.weeklyPlans[1].week,
      phase: plan.weeklyPlans[1].phase,
      theme: plan.weeklyPlans[1].theme,
    });
    expect(preview!.lockedWeeks[0]).not.toHaveProperty("tasks");
    expect(preview!.lockedTaskCount).toBe(
      plan.weeklyPlans.slice(1).reduce((sum, w) => sum + w.tasks.length, 0),
    );
  });
  it("väljer den lägsta veckan även om listan är osorterad", () => {
    const week = (n: number): WeekPlan => ({ week: n, phase: `Fas ${n}`, theme: "t", focus: "f", tasks: [] });
    expect(buildPlanPreview([week(3), week(1), week(2)])!.firstWeek.week).toBe(1);
  });
  it("ger null för en plan utan veckor", () => {
    expect(buildPlanPreview([])).toBeNull();
  });
});
