import { describe, expect, it } from "vitest";
import { distributeTasks, normalizeStudyDays, todayInPlan, weekdayOf } from "./study-days";
import type { StudyTask, WeekPlan } from "./study-plan";

const task = (id: string, minutes: number): StudyTask => ({
  id,
  title: id,
  detail: "",
  minutes,
  section: "ORD",
  practiceKinds: ["ord"],
});

const week = (n: number, tasks: StudyTask[]): WeekPlan => ({ week: n, phase: "Bas", theme: "t", focus: "f", tasks });

describe("normalizeStudyDays", () => {
  it("sorterar, tar bort dubbletter och ogiltiga dagar", () => {
    expect(normalizeStudyDays([4, 0, 4, 7, -1, 2.5, 2])).toEqual([0, 2, 4]);
  });
  it("ger null för tomt eller fel typ", () => {
    expect(normalizeStudyDays([])).toBeNull();
    expect(normalizeStudyDays("0,1")).toBeNull();
  });
});

describe("distributeTasks", () => {
  const tasks = [task("a", 70), task("b", 90), task("c", 80), task("d", 60), task("e", 85)];

  it("ger en uppgift per dag med fem uppgifter och fem dagar", () => {
    const buckets = distributeTasks(tasks, [0, 1, 2, 3, 4]);
    expect(buckets.map((b) => b.tasks.map((t) => t.id))).toEqual([["a"], ["b"], ["c"], ["d"], ["e"]]);
  });

  it("behåller ordningen och fördelar minuterna jämnt på tre dagar", () => {
    const buckets = distributeTasks(tasks, [0, 2, 4]);
    expect(buckets.map((b) => b.day)).toEqual([0, 2, 4]);
    expect(buckets.flatMap((b) => b.tasks.map((t) => t.id))).toEqual(["a", "b", "c", "d", "e"]);
    const minutes = buckets.map((b) => b.minutes);
    expect(Math.max(...minutes) - Math.min(...minutes)).toBeLessThanOrEqual(90);
    expect(minutes.every((m) => m > 0)).toBe(true);
  });

  it("lägger allt på dagen när det bara finns en pluggdag", () => {
    expect(distributeTasks(tasks, [5])[0].tasks).toHaveLength(5);
  });

  it("lämnar dagar tomma när det finns fler dagar än uppgifter", () => {
    const buckets = distributeTasks(tasks.slice(0, 2), [0, 1, 2, 3, 4, 5, 6]);
    expect(buckets.filter((b) => b.tasks.length > 0)).toHaveLength(2);
    expect(buckets.flatMap((b) => b.tasks.map((t) => t.id))).toEqual(["a", "b"]);
  });
});

describe("todayInPlan", () => {
  // Planen börjar måndag 2 nov 2026, provet 30 jan 2027.
  const plans = [
    week(1, [task("w1a", 60), task("w1b", 60), task("w1c", 60)]),
    week(2, [task("w2a", 60), task("w2b", 60), task("w2c", 60)]),
  ];
  const base = { weeklyPlans: plans, planStart: "2026-11-02", examDate: "2027-01-30", studyDays: [0, 2, 4] };

  it("vet veckodagen", () => {
    expect(weekdayOf("2026-11-04")).toBe(2); // onsdag
  });

  it("visar dagens uppgifter en pluggdag", () => {
    const s = todayInPlan({ ...base, progress: {}, today: "2026-11-04" });
    expect(s).toMatchObject({ kind: "study-day", week: 1, openEarlier: 1 });
    if (s.kind === "study-day") expect(s.tasks.map((t) => t.task.id)).toEqual(["w1b"]);
  });

  it("räknar inte gjorda uppgifter från tidigare dagar", () => {
    const s = todayInPlan({ ...base, progress: { "w1:w1a": true }, today: "2026-11-04" });
    expect(s).toMatchObject({ kind: "study-day", openEarlier: 0 });
  });

  it("visar nästa pluggdag en vilodag", () => {
    const s = todayInPlan({ ...base, progress: {}, today: "2026-11-05" }); // torsdag
    expect(s.kind).toBe("rest-day");
    if (s.kind === "rest-day") {
      expect(s.next?.date).toBe("2026-11-06");
      expect(s.next?.tasks.map((t) => t.task.id)).toEqual(["w1c"]);
    }
  });

  it("hoppar till nästa vecka efter veckans sista pluggdag", () => {
    const s = todayInPlan({ ...base, progress: {}, today: "2026-11-08" }); // söndag
    expect(s.kind).toBe("rest-day");
    if (s.kind === "rest-day") {
      expect(s.next?.date).toBe("2026-11-09");
      expect(s.next?.tasks[0]).toMatchObject({ week: 2, task: { id: "w2a" } });
    }
  });

  it("säger när planen börjar om den inte har börjat", () => {
    expect(todayInPlan({ ...base, progress: {}, today: "2026-10-28" })).toEqual({
      kind: "not-started",
      startsOn: "2026-11-02",
    });
  });
});
