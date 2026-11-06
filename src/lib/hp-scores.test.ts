import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemStorage } from "@/test/sync-world";
import { DEFAULT_SCORES, withExamDate, type ScoreInput } from "./hp-scores";

const base = { ...DEFAULT_SCORES, weeksUntilExam: 0 };

describe("withExamDate", () => {
  it("startar planen den här veckan och räknar veckorna till provet", () => {
    const s = withExamDate(base, "2027-04-10", "2027-01-20");
    expect(s).toMatchObject({ examDate: "2027-04-10", planStart: "2027-01-18", weeksUntilExam: 12 });
  });

  it("behåller planens start när provdatumet är detsamma (nya resultat flyttar inte kalendern)", () => {
    const first = withExamDate(base, "2027-04-10", "2027-01-20");
    const later = withExamDate({ ...base, quantNorm: 1.6 }, "2027-04-10", "2027-02-10", first);
    expect(later.planStart).toBe("2027-01-18");
    expect(later.weeksUntilExam).toBe(12);
  });

  it("startar om kalendern när provdatumet ändras", () => {
    const first = withExamDate(base, "2027-04-10", "2027-01-20");
    const moved = withExamDate(base, "2027-10-24", "2027-02-10", first);
    expect(moved.planStart).toBe("2027-07-05"); // provveckan börjar 18 okt, 15 veckor tidigare
    expect(moved.weeksUntilExam).toBe(16);
  });
});

describe("loadScores", () => {
  let storage: MemStorage;

  beforeEach(() => {
    vi.resetModules();
    storage = new MemStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", new EventTarget());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function load(stored: Partial<ScoreInput> & Record<string, unknown>) {
    storage.setItem("hp-lift-scores-v1", JSON.stringify(stored));
    storage.setItem("hp-lift-scores-saved-v1", "1");
    const { loadScores } = await import("./hp-scores");
    return loadScores();
  }

  it("räknar fram veckorna ur provdatum och planstart", async () => {
    const s = await load({ ...DEFAULT_SCORES, weeksUntilExam: 3, examDate: "2027-04-10", planStart: "2027-01-18" });
    expect(s).toMatchObject({ examDate: "2027-04-10", planStart: "2027-01-18", weeksUntilExam: 12 });
  });

  it("läser äldre underlag utan provdatum som förut", async () => {
    const s = await load({ ...DEFAULT_SCORES, weeksUntilExam: 6 });
    expect(s?.weeksUntilExam).toBe(6);
    expect(s?.examDate).toBeUndefined();
  });

  it("ignorerar ogiltiga datum", async () => {
    const s = await load({ ...DEFAULT_SCORES, weeksUntilExam: 6, examDate: "2027-02-30", planStart: "x" });
    expect(s?.weeksUntilExam).toBe(6);
    expect(s?.examDate).toBeUndefined();
  });
});
