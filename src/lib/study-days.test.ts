import { describe, expect, it } from "vitest";
import { distributeTasks, firstDayOfWeek, normalizeStudyDays, scheduleWeek, skippedWeekdays, todayInPlan, weekdayOf } from "./study-days";
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

describe("scheduleWeek", () => {
  const tasks = [task("a", 60), task("b", 60), task("c", 60)];
  const ids = (items: { task: StudyTask }[]) => items.map((i) => i.task.id);
  const base = { tasks, week: 1, studyDays: [0, 2, 4] };

  it("är den vanliga fördelningen för en vecka som inte är den aktuella", () => {
    const s = scheduleWeek({ ...base, progress: {}, weekday: null });
    expect(s.days.map((d) => ids(d.items))).toEqual([["a"], ["b"], ["c"]]);
    expect(s.dropped).toEqual([]);
  });

  it("ändrar ingenting när allt hittills är gjort", () => {
    const s = scheduleWeek({ ...base, progress: { "w1:a": true }, weekday: 2 });
    expect(s.days.map((d) => ids(d.items))).toEqual([["a"], ["b"], ["c"]]);
    expect(s.dropped).toEqual([]);
    expect(s.days[1].items[0].movedFrom).toBeNull();
  });

  it("flyttar ett missat pass framåt och krymper veckan i stället för att stapla", () => {
    const s = scheduleWeek({ ...base, progress: {}, weekday: 2 }); // onsdag, måndagens pass ogjort
    expect(ids(s.days[0].items)).toEqual([]);
    expect(ids(s.days[1].items)).toEqual(["a"]);
    expect(s.days[1].items[0].movedFrom).toBe(0);
    expect(ids(s.days[2].items)).toEqual(["b"]);
    expect(s.days[2].items[0].movedFrom).toBe(2);
    expect(ids(s.dropped)).toEqual(["c"]); // lägst prioritet ryker
  });

  it("lägger aldrig mer än ~25 % över snittet på en dag", () => {
    const five = [task("a", 70), task("b", 90), task("c", 80), task("d", 60), task("e", 85)];
    const s = scheduleWeek({ tasks: five, week: 1, studyDays: [0, 1, 2, 3, 4], progress: {}, weekday: 3 });
    const perDay = (70 + 90 + 80 + 60 + 85) / 5;
    for (const d of s.days) {
      const minutes = d.items.filter((i) => !i.done).reduce((sum, i) => sum + i.task.minutes, 0);
      expect(minutes).toBeLessThanOrEqual(Math.max(perDay * 1.25, 90));
    }
    expect(s.days.flatMap((d) => ids(d.items)).length + s.dropped.length).toBe(5);
  });

  it("släpper inget pass på veckans första dag när inget är missat", () => {
    const five = [task("a", 70), task("b", 90), task("c", 80), task("d", 60), task("e", 85)];
    const s = scheduleWeek({ tasks: five, week: 1, studyDays: [0, 2, 4], progress: {}, weekday: 0 });
    expect(s.dropped).toEqual([]);
    expect(s.days.flatMap((d) => ids(d.items))).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("låter gjorda pass stå kvar på sin dag", () => {
    const s = scheduleWeek({ ...base, progress: { "w1:c": true }, weekday: 2 });
    // c är gjord i förväg och står kvar på fredag utan att ta tid. Måndagens
    // missade a går först idag, och b får plats på fredag bredvid c.
    expect(ids(s.days[1].items)).toEqual(["a"]);
    expect(ids(s.days[2].items)).toEqual(["b", "c"]);
    expect(s.dropped).toEqual([]);
    expect(s.days[2].items.find((i) => i.task.id === "c")?.done).toBe(true);
  });
});

describe("todayInPlan", () => {
  // Planen börjar måndag 2 nov 2026, provet 30 jan 2027. Pluggdagar mån, ons, fre.
  const plans = [
    week(1, [task("w1a", 60), task("w1b", 60), task("w1c", 60)]),
    week(2, [task("w2a", 60), task("w2b", 60), task("w2c", 60)]),
  ];
  const base = { weeklyPlans: plans, planStart: "2026-11-02", examDate: "2027-01-30", studyDays: [0, 2, 4] };

  it("vet veckodagen", () => {
    expect(weekdayOf("2026-11-04")).toBe(2); // onsdag
  });

  it("visar dagens uppgift en pluggdag", () => {
    const s = todayInPlan({ ...base, progress: { "w1:w1a": true }, today: "2026-11-04" });
    expect(s).toMatchObject({ kind: "study-day", week: 1, dropped: 0 });
    if (s.kind === "study-day") expect(s.tasks.map((t) => t.task.id)).toEqual(["w1b"]);
  });

  it("tar med ett missat pass från tidigare i veckan i dagens lista", () => {
    const s = todayInPlan({ ...base, progress: {}, today: "2026-11-04" });
    expect(s).toMatchObject({ kind: "study-day", dropped: 1 });
    if (s.kind === "study-day") {
      expect(s.tasks.map((t) => t.task.id)).toEqual(["w1a"]);
      expect(s.tasks[0].movedFrom).toBe(0);
    }
  });

  it("visar nästa pluggdag en vilodag, med flyttade pass", () => {
    const s = todayInPlan({ ...base, progress: {}, today: "2026-11-05" }); // torsdag
    expect(s.kind).toBe("rest-day");
    if (s.kind === "rest-day") {
      expect(s.next?.date).toBe("2026-11-06");
      expect(s.next?.tasks.map((t) => t.task.id)).toEqual(["w1a"]);
      expect(s.dropped).toBe(2);
    }
  });

  it("hoppar till nästa vecka efter veckans sista pluggdag", () => {
    const s = todayInPlan({ ...base, progress: { "w1:w1a": true, "w1:w1b": true, "w1:w1c": true }, today: "2026-11-08" });
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

describe("hoppa över", () => {
  const tasks = [task("a", 60), task("b", 60), task("c", 60)];
  const ids = (items: { task: StudyTask }[]) => items.map((i) => i.task.id);

  it("flyttar ett pass som hoppas över idag till nästa pluggdag", () => {
    // Måndag, pluggdagar mån/ons/fre: a hoppas över och hamnar på onsdag.
    const s = scheduleWeek({ tasks, week: 1, studyDays: [0, 2, 4], progress: {}, weekday: 0, skippedOn: { a: 0 } });
    expect(ids(s.days[0].items)).toEqual([]);
    expect(ids(s.days[1].items)).toEqual(["a"]);
    expect(s.days[1].items[0].skipped).toBe(true);
  });

  it("krymper veckan om det överhoppade passet inte får plats", () => {
    const s = scheduleWeek({ tasks, week: 1, studyDays: [0, 2, 4], progress: {}, weekday: 4, skippedOn: { c: 4 } });
    expect(ids(s.dropped)).toContain("c");
    expect(s.dropped.find((i) => i.task.id === "c")?.skipped).toBe(true);
  });

  it("läser bara överhoppningar i rätt vecka", () => {
    const skipped = { "w1:a": "2026-11-02", "w2:b": "2026-11-10", "w1:c": "2026-10-20" };
    expect(skippedWeekdays(skipped, 1, "2026-11-02")).toEqual({ a: 0 });
    expect(skippedWeekdays(skipped, 2, "2026-11-09")).toEqual({ b: 1 });
  });

  it("gör det i todayInPlan också", () => {
    const plans = [week(1, [task("w1a", 60), task("w1b", 60), task("w1c", 60)])];
    const s = todayInPlan({
      weeklyPlans: plans,
      planStart: "2026-11-02",
      examDate: "2027-01-30",
      studyDays: [0, 2, 4],
      progress: {},
      today: "2026-11-02",
      skipped: { "w1:w1a": "2026-11-02" },
    });
    expect(s.kind).toBe("rest-day");
    if (s.kind === "rest-day") expect(s.next?.tasks.map((t) => t.task.id)).toEqual(["w1a"]);
  });
});

describe("plan som skapas mitt i veckan", () => {
  const tasks = [task("a", 60), task("b", 60), task("c", 60)];
  const ids = (items: { task: StudyTask }[]) => items.map((i) => i.task.id);

  it("räknar första veckan från skapandedagen", () => {
    expect(firstDayOfWeek(1, "2026-11-02", "2026-11-06")).toBe(4); // fredag
    expect(firstDayOfWeek(2, "2026-11-02", "2026-11-06")).toBe(0);
    expect(firstDayOfWeek(1, "2026-11-02", undefined)).toBe(0);
  });

  it("räknar inga pass som missade och gör första veckan kortare när planen skapas på en fredag", () => {
    const s = scheduleWeek({ tasks, week: 1, studyDays: [0, 1, 2, 3, 4], progress: {}, weekday: 4, firstDay: 4 });
    expect(s.days.flatMap((d) => d.items).every((i) => i.movedFrom === null)).toBe(true);
    // En dags normala mängd (snittet för en hel vecka) i stället för hela veckan på fredagen.
    expect(ids(s.days.find((d) => d.day === 4)!.items)).toEqual(["a"]);
    expect(ids(s.dropped)).toEqual(["b", "c"]);
  });

  it("använder helgen om inga pluggdagar finns kvar i veckan", () => {
    const s = scheduleWeek({ tasks, week: 1, studyDays: [0, 1, 2, 3, 4], progress: {}, weekday: 5, firstDay: 5 });
    expect(s.days.map((d) => d.day)).toEqual([5, 6]);
    expect(s.days.flatMap((d) => ids(d.items)).length + s.dropped.length).toBe(3);
  });
});
