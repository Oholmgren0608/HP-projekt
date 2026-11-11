import { describe, expect, it } from "vitest";
import { isAllowedUhrQuestion, isPublishableProvfraga, isUhrQuestionId, preferUhr, uhrSource } from "./uhr";

describe("uhrSource", () => {
  it("skriver provet, provpasset och uppgiften", () => {
    expect(uhrSource("hp-2019-10-20-p1-q3")).toBe("Högskoleprovet hösten 2019, provpass 1, uppgift 3");
    expect(uhrSource("hp-2024-04-13-p5-q40")).toBe("Högskoleprovet våren 2024, provpass 5, uppgift 40");
  });

  it("skiljer de två vårproven 2021 och 2022 åt med datum", () => {
    expect(uhrSource("hp-2021-03-13-p3-q12")).toBe("Högskoleprovet våren 2021 (13 mars), provpass 3, uppgift 12");
    expect(uhrSource("hp-2022-05-07-p1-q1")).toBe("Högskoleprovet våren 2022 (7 maj), provpass 1, uppgift 1");
    expect(uhrSource("hp-2021-10-24-p1-q1")).toBe("Högskoleprovet hösten 2021, provpass 1, uppgift 1");
  });

  it("ger null för appens egna frågor och okända id", () => {
    expect(uhrSource("ovn-xyz-007")).toBeNull();
    expect(uhrSource("hp-2019-10-20")).toBeNull();
    expect(uhrSource("hp-2019-13-20-p1-q1")).toBeNull();
  });
});

describe("isAllowedUhrQuestion", () => {
  it("släpper bara igenom kvantitativa UHR-frågor", () => {
    for (const kind of ["xyz", "kva", "nog", "dtk"]) {
      expect(isAllowedUhrQuestion({ id: "hp-2019-10-20-p1-q3", kind })).toBe(true);
    }
    for (const kind of ["ord", "las", "mek", "elf"]) {
      expect(isAllowedUhrQuestion({ id: "hp-2019-10-20-p2-q3", kind })).toBe(false);
    }
    expect(isAllowedUhrQuestion({ id: "ovn-xyz-1", kind: "xyz" })).toBe(false);
    expect(isUhrQuestionId("hp-x")).toBe(true);
  });
});

describe("preferUhr", () => {
  it("lägger UHR-frågorna först och behåller ordningen inom grupperna", () => {
    const qs = [{ id: "a" }, { id: "hp-1" }, { id: "b" }, { id: "hp-2" }];
    expect(preferUhr(qs).map((q) => q.id)).toEqual(["hp-1", "hp-2", "a", "b"]);
  });

  it("lämnar listan orörd utan UHR-frågor", () => {
    const qs = [{ id: "a" }, { id: "b" }];
    expect(preferUhr(qs)).toBe(qs);
  });
});

describe("isPublishableProvfraga", () => {
  const base = { id: "hp-2019-10-20-p1-q3", kind: "xyz", examId: "hp-2019-10-20", explain: "Räkna ut arean.", pool: "ovning" };
  it("följer databasens villkor", () => {
    expect(isPublishableProvfraga(base)).toBe(true);
    expect(isPublishableProvfraga({ ...base, kind: "ord" })).toBe(false);
    expect(isPublishableProvfraga({ ...base, examId: null })).toBe(false);
    expect(isPublishableProvfraga({ ...base, pool: "spel" })).toBe(false);
    expect(isPublishableProvfraga({ ...base, explain: "Förklaring saknas ännu — importerad från provet." })).toBe(false);
    expect(isPublishableProvfraga({ ...base, explain: "FLAGGOR: option-count" })).toBe(false);
    expect(isPublishableProvfraga({ ...base, id: "ovn-xyz-1" })).toBe(false);
  });
});
