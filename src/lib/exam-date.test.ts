import { describe, expect, it } from "vitest";
import {
  addDays,
  currentPlanWeek,
  formatDateLong,
  formatWeekRange,
  isDateKey,
  mondayOf,
  planStartFor,
  planWeekCount,
  planWeekRange,
  todayKey,
  upcomingExamDates,
  weeksLeft,
} from "./exam-date";

describe("datum", () => {
  it("känner igen giltiga datum", () => {
    expect(isDateKey("2027-04-10")).toBe(true);
    expect(isDateKey("2027-02-30")).toBe(false);
    expect(isDateKey("10/4/2027")).toBe(false);
    expect(isDateKey(20270410)).toBe(false);
  });

  it("hittar måndagen i veckan", () => {
    expect(mondayOf("2026-11-06")).toBe("2026-11-02"); // fredag
    expect(mondayOf("2026-11-02")).toBe("2026-11-02"); // måndag
    expect(mondayOf("2026-11-08")).toBe("2026-11-02"); // söndag
    expect(mondayOf("2027-01-01")).toBe("2026-12-28"); // över årsskiftet
  });

  it("påverkas inte av sommartid", () => {
    // Sommartiden slutar 25 okt 2026 och börjar 28 mars 2027 i Sverige.
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(mondayOf("2027-03-29")).toBe("2027-03-29");
    expect(addDays("2027-03-27", 7)).toBe("2027-04-03");
  });

  it("ger dagens datum i lokal kalender", () => {
    expect(todayKey(new Date(2026, 10, 6, 23, 30))).toBe("2026-11-06");
  });
});

describe("planens kalender", () => {
  const exam = "2027-04-10"; // lördag

  it("startar den här veckan när provet är inom 16 veckor", () => {
    expect(planStartFor(exam, "2027-01-20")).toBe("2027-01-18");
    expect(planWeekCount("2027-01-18", exam)).toBe(12);
  });

  it("täcker de sista 16 veckorna när provet ligger längre bort", () => {
    const start = planStartFor(exam, "2026-11-06");
    expect(start).toBe("2026-12-21");
    expect(planWeekCount(start, exam)).toBe(16);
    expect(currentPlanWeek(start, exam, "2026-11-06")).toBe(0);
  });

  it("räknar den här veckan och provveckan", () => {
    expect(planWeekCount("2027-04-05", exam)).toBe(1);
    expect(planWeekCount("2027-03-29", exam)).toBe(2);
  });

  it("vet vilken vecka i planen dagens datum ligger i", () => {
    const start = "2027-01-18";
    expect(currentPlanWeek(start, exam, "2027-01-18")).toBe(1);
    expect(currentPlanWeek(start, exam, "2027-01-24")).toBe(1); // söndag samma vecka
    expect(currentPlanWeek(start, exam, "2027-01-25")).toBe(2);
    expect(currentPlanWeek(start, exam, "2027-04-10")).toBe(12);
    expect(currentPlanWeek(start, exam, "2027-05-01")).toBe(12); // efter provet
  });

  it("räknar veckor kvar till provet", () => {
    expect(weeksLeft(exam, "2027-04-10")).toBe(1);
    expect(weeksLeft(exam, "2027-04-05")).toBe(1);
    expect(weeksLeft(exam, "2027-04-04")).toBe(2);
    expect(weeksLeft(exam, "2027-04-11")).toBe(0);
  });

  it("ger måndag–söndag för en vecka i planen", () => {
    expect(planWeekRange("2027-01-18", 3)).toEqual({ start: "2027-02-01", end: "2027-02-07" });
  });
});

describe("format och provtillfällen", () => {
  it("skriver datum på svenska", () => {
    expect(formatDateLong("2027-04-10")).toBe("10 april 2027");
    expect(formatWeekRange({ start: "2026-11-09", end: "2026-11-15" })).toBe("9–15 nov");
    expect(formatWeekRange({ start: "2026-11-30", end: "2026-12-06" })).toBe("30 nov–6 dec");
  });

  it("visar bara kommande prov, provdagen inräknad", () => {
    expect(upcomingExamDates("2027-04-10").map((e) => e.date)).toContain("2027-04-10");
    expect(upcomingExamDates("2027-04-11").map((e) => e.date)).not.toContain("2027-04-10");
  });
});
