import { describe, expect, it } from "vitest";
import { addDeltas, canonical, mergeValues, TOMBSTONE, type Base } from "./merge";

const empty: Base = { known: true, raw: null };
const unknown: Base = { known: false };
const base = (value: unknown): Base => ({ known: true, raw: JSON.stringify(value) });
const merge = (key: string, b: Base, local: unknown, remote: unknown) =>
  JSON.parse(mergeValues(key, b, JSON.stringify(local), JSON.stringify(remote)));

describe("addDeltas", () => {
  it("lägger ihop båda sidornas ändringar från basen", () => {
    expect(addDeltas(10, 13, 15, true)).toBe(18);
  });
  it("räknar en saknad räknare som oförändrad", () => {
    expect(addDeltas(10, undefined, 15, true)).toBe(15);
  });
  it("tar det största värdet när basen är okänd", () => {
    expect(addDeltas(undefined, 13, 15, false)).toBe(15);
  });
});

describe("historik", () => {
  const quiz = (at: string, total: number) => ({ type: "quiz", at, source: "free", kinds: ["ord"], correct: 1, total });

  it("är unionen i tidsordning, utan dubbletter", () => {
    const shared = quiz("2026-11-01T08:00:00.000Z", 5);
    const a = quiz("2026-11-02T08:00:00.000Z", 3);
    const b = quiz("2026-11-02T09:00:00.000Z", 4);
    expect(merge("hp-lift-history-v1", empty, [shared, a], [shared, b])).toEqual([shared, a, b]);
  });

  it("behåller appens tak på 80 händelser (de senaste)", () => {
    const l = Array.from({ length: 60 }, (_, i) => quiz(`2026-10-01T08:${String(i).padStart(2, "0")}:00.000Z`, 1));
    const r = Array.from({ length: 60 }, (_, i) => quiz(`2026-10-02T08:${String(i).padStart(2, "0")}:00.000Z`, 1));
    const out = merge("hp-lift-history-v1", empty, l, r);
    expect(out).toHaveLength(80);
    expect(out.at(-1)).toEqual(r.at(-1));
  });
});

describe("visade frågor", () => {
  it("är unionen per delprov, senast visade sist", () => {
    const out = merge("hp-lift-seen-questions-v1", empty, { ord: ["a", "b"] }, { ord: ["c", "b"], kva: ["x"] });
    expect(out.ord).toEqual(["a", "c", "b"]);
    expect(out.kva).toEqual(["x"]);
  });
});

describe("mastery", () => {
  it("respekterar en nollställd serie på ena sidan", () => {
    expect(merge("hp-lift-mastery-v2", base({ q1: 2, q2: 1 }), { q2: 1 }, { q1: 2, q2: 2 })).toEqual({ q2: 2 });
  });
  it("tar den högsta serien när båda har ökat", () => {
    expect(merge("hp-lift-mastery-v2", base({ q1: 1 }), { q1: 2 }, { q1: 3 })).toEqual({ q1: 3 });
  });
  it("blir union med högsta värdet när basen är okänd", () => {
    expect(merge("hp-lift-mastery-v2", unknown, { q1: 1 }, { q1: 3, q2: 1 })).toEqual({ q1: 3, q2: 1 });
  });
});

describe("felkort", () => {
  const card = (id: string, lapses: number, reps: number, due: string) => ({ id, front: "", back: "", explain: "", kind: "ord", due, interval: 1, ease: 2.5, reps, lapses });

  it("är unionen, och kortet med flest misstag och repetitioner vinner", () => {
    const out = merge(
      "hp-lift-srs-v1",
      empty,
      { a: card("a", 1, 3, "2026-11-05"), b: card("b", 0, 0, "2026-11-02") },
      { a: card("a", 2, 0, "2026-11-02"), c: card("c", 0, 0, "2026-11-02") },
    );
    expect(Object.keys(out).sort()).toEqual(["a", "b", "c"]);
    expect(out.a.lapses).toBe(2);
  });
  it("släpper aldrig igenom verbala UHR-frågor", () => {
    expect(merge("hp-lift-srs-v1", empty, {}, { "hp-2024-04-p1-q1": card("hp-2024-04-p1-q1", 0, 0, "2026-11-02") })).toEqual({});
    const noKind = { ...card("hp-2024-04-13-p2-q1", 0, 0, "2026-11-02"), kind: undefined };
    expect(merge("hp-lift-srs-v1", empty, { "hp-2024-04-13-p2-q1": noKind }, {})).toEqual({});
  });
  it("behåller felkort för kvantitativa UHR-frågor", () => {
    const xyz = { ...card("hp-2024-04-13-p2-q3", 1, 0, "2026-11-02"), kind: "xyz" };
    expect(merge("hp-lift-srs-v1", empty, { "hp-2024-04-13-p2-q3": xyz }, {})).toEqual({ "hp-2024-04-13-p2-q3": xyz });
  });
});

describe("veckoplanens bockar och lästa texter", () => {
  it("behåller det båda gjort och respekterar en återställd vecka", () => {
    const out = merge(
      "hp-studieplan-progress-v2",
      base({ "w1:a": true, "w1:b": true }),
      { "w1:a": true, "w1:b": true, "w2:c": true },
      { "w3:d": true },
    );
    expect(out).toEqual({ "w2:c": true, "w3:d": true });
  });
  it("blir union när basen är okänd", () => {
    expect(merge("hp-reading-done-v1", unknown, { t1: true }, { t2: true })).toEqual({ t1: true, t2: true });
  });
});

describe("poäng per veckouppgift", () => {
  it("tar det senast sparade resultatet", () => {
    const out = merge(
      "hp-studieplan-scores-v1",
      empty,
      { "w1:a": { correct: 3, total: 5, at: "2026-11-02T10:00:00.000Z" } },
      { "w1:a": { correct: 4, total: 5, at: "2026-11-02T11:00:00.000Z" } },
    );
    expect(out["w1:a"].correct).toBe(4);
  });
});

describe("låsta veckor", () => {
  it("låter molnet vinna när båda låst samma vecka olika", () => {
    const out = merge("hp-lift-locked-weeks-v1", empty, { "1": { week: 1, theme: "lokal" } }, { "1": { week: 1, theme: "moln" } });
    expect(out["1"].theme).toBe("moln");
  });
});

describe("flashcards", () => {
  it("lägger ihop räknarna från båda enheterna", () => {
    const out = merge(
      "hp-flashcards-progress-v1",
      base({ k: { correct: 2, wrong: 1 } }),
      { k: { correct: 3, wrong: 1, last: "correct" } },
      { k: { correct: 2, wrong: 3, last: "wrong" }, n: { correct: 1, wrong: 0 } },
    );
    expect(out.k).toMatchObject({ correct: 3, wrong: 3 });
    expect(out.n).toMatchObject({ correct: 1, wrong: 0 });
  });
});

describe("belönade veckor och rapporterade dueller", () => {
  it("är unionen", () => {
    expect(merge("hp-lift-reported-duels-v1", empty, { m1: true }, { m2: true })).toEqual({ m1: true, m2: true });
  });
});

describe("gamification", () => {
  const state = (over: Record<string, unknown>) => ({
    xp: 0,
    streak: { current: 0, best: 0, lastActive: null },
    activeDays: {},
    achievements: {},
    quests: { date: "2026-11-02", items: [{ id: "q", progress: 0, done: false }], allDone: false },
    stats: { questionsAnswered: 0, correctAnswers: 0 },
    today: { date: "2026-11-02", questions: 0, correct: 0, xp: 0 },
    weeklyXp: {},
    onboarded: false,
    ...over,
  });

  it("lägger ihop XP och statistik från båda sidor", () => {
    const b = state({ xp: 100, stats: { questionsAnswered: 10, correctAnswers: 5 } });
    const l = state({ xp: 130, stats: { questionsAnswered: 15, correctAnswers: 8 } });
    const r = state({ xp: 120, stats: { questionsAnswered: 14, correctAnswers: 6 } });
    const out = merge("hp-lift-gamification-v1", base(b), l, r);
    expect(out.xp).toBe(150);
    expect(out.stats).toEqual({ questionsAnswered: 19, correctAnswers: 9 });
  });

  it("räknar inte dubbelt när basen är okänd (data från före synkposterna)", () => {
    const out = merge("hp-lift-gamification-v1", unknown, state({ xp: 500 }), state({ xp: 520 }));
    expect(out.xp).toBe(520);
  });

  it("lägger ihop dagens mätare samma dag och slår ihop uppdragen", () => {
    const l = state({
      today: { date: "2026-11-02", questions: 5, correct: 2, xp: 20 },
      quests: { date: "2026-11-02", items: [{ id: "q", progress: 5, done: true }], allDone: true },
    });
    const r = state({ today: { date: "2026-11-02", questions: 3, correct: 1, xp: 10 } });
    const out = merge("hp-lift-gamification-v1", empty, l, r);
    expect(out.today).toEqual({ date: "2026-11-02", questions: 8, correct: 3, xp: 30 });
    expect(out.quests.items[0]).toMatchObject({ done: true, progress: 5 });
  });

  it("förlänger streaken när dagarna däremellan är aktiva", () => {
    const l = state({
      streak: { current: 3, best: 3, lastActive: "2026-11-02" },
      activeDays: { "2026-10-31": true, "2026-11-01": true, "2026-11-02": true },
    });
    const r = state({
      streak: { current: 5, best: 5, lastActive: "2026-11-04" },
      activeDays: { "2026-11-03": true, "2026-11-04": true },
    });
    const out = merge("hp-lift-gamification-v1", empty, l, r);
    expect(out.streak).toEqual({ current: 5, best: 5, lastActive: "2026-11-04" });
    const gap = merge("hp-lift-gamification-v1", empty, { ...l, streak: { current: 9, best: 9, lastActive: "2026-11-02" } }, r);
    expect(gap.streak.current).toBe(11);
  });

  it("slår ihop achievements med den första upplåsningen", () => {
    const out = merge(
      "hp-lift-gamification-v1",
      empty,
      state({ achievements: { a: { unlockedAt: "2026-11-02T10:00:00.000Z", seen: true } } }),
      state({ achievements: { a: { unlockedAt: "2026-11-01T10:00:00.000Z", seen: false }, b: { unlockedAt: "2026-11-01T11:00:00.000Z", seen: false } } }),
    );
    expect(out.achievements.a).toEqual({ unlockedAt: "2026-11-01T10:00:00.000Z", seen: true });
    expect(Object.keys(out.achievements).sort()).toEqual(["a", "b"]);
  });
});

describe("inställningar och raderingar", () => {
  it("låter den här enhetens inställning vinna (den synkar sist)", () => {
    expect(merge("hp-lift-practice-mode-v1", empty, { timeLimit: "off" }, { timeLimit: "normal" })).toEqual({ timeLimit: "off" });
  });
  it("låter en lokal radering vinna", () => {
    expect(mergeValues("hp-lift-scores-v1", empty, TOMBSTONE, '{"quantNorm":1}')).toBe(TOMBSTONE);
  });
  it("ger samma värde när båda sidor är lika", () => {
    expect(mergeValues("hp-lift-history-v1", unknown, "[]", "[]")).toBe("[]");
  });
});

describe("canonical", () => {
  it("är oberoende av nycklarnas ordning", () => {
    expect(canonical({ b: 1, a: [1, { d: 2, c: 3 }] })).toBe(canonical({ a: [1, { c: 3, d: 2 }], b: 1 }));
  });
});

describe("överhoppade pass", () => {
  it("är unionen och behåller det senaste datumet", () => {
    expect(
      merge("hp-lift-skipped-tasks-v1", empty, { "w1:a": "2026-11-02", "w1:b": "2026-11-03" }, { "w1:a": "2026-11-04", "w1:c": "2026-11-05" }),
    ).toEqual({ "w1:a": "2026-11-04", "w1:b": "2026-11-03", "w1:c": "2026-11-05" });
  });
});
