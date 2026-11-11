import { describe, expect, it, vi } from "vitest";
import type { ChoiceQuestion } from "@/lib/practice-types";

const bank: ChoiceQuestion[] = [];
vi.mock("@/lib/content/questions-provider", () => ({ getQuestions: () => bank }));

const { buildQuiz } = await import("./practice");

function q(id: string): ChoiceQuestion {
  return { id, kind: "xyz", prompt: "p", options: ["a", "b", "c", "d"], correctIndex: 0, explain: "e" };
}

bank.push(
  ...["ovn-xyz-1", "ovn-xyz-2", "ovn-xyz-3", "ovn-xyz-4"].map(q),
  ...["hp-2019-10-20-p1-q1", "hp-2019-10-20-p1-q2", "hp-2019-10-20-p1-q3"].map(q),
);
const uhr = (ids: string[]) => ids.filter((id) => id.startsWith("hp-"));

describe("buildQuiz med UHR-frågor", () => {
  it("väljer UHR-frågorna först", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      const ids = buildQuiz("xyz", seed, 3).map((x) => x.id);
      expect(uhr(ids)).toHaveLength(3);
    }
  });

  it("fyller på med appens egna frågor när UHR-frågorna inte räcker", () => {
    const ids = buildQuiz("xyz", "seed", 5).map((x) => x.id);
    expect(ids.slice(0, 3).every((id) => id.startsWith("hp-"))).toBe(true);
    expect(ids.slice(3).every((id) => id.startsWith("ovn-"))).toBe(true);
  });

  it("låter osedda egna frågor gå före nyligen sedda UHR-frågor", () => {
    const seen = ["hp-2019-10-20-p1-q1", "hp-2019-10-20-p1-q2", "hp-2019-10-20-p1-q3"];
    const ids = buildQuiz("xyz", "seed", 4, seen).map((x) => x.id);
    expect(uhr(ids)).toHaveLength(0);
  });
});
