import { describe, expect, it } from "vitest";
import type { AmaPlayer } from "@/lib/supabase/client";
import { distributionPercent, formatPoints, kindsText, placement, topWithMe } from "./format";

const p = (rank: number, isMe = false): AmaPlayer => ({
  player_id: `p${rank}`,
  name: `Spelare ${rank}`,
  is_bot: false,
  is_me: isMe,
  is_host: false,
  score: 1000 - rank,
  correct: 0,
  left: false,
  rank,
});

describe("Alla mot alla – visning", () => {
  it("placering på svenska", () => {
    expect(placement(1)).toBe("1:a");
    expect(placement(2)).toBe("2:a");
    expect(placement(3)).toBe("3:e");
    expect(placement(11)).toBe("11:e");
  });

  it("poäng med mellanslag som tusentalsavgränsare", () => {
    expect(formatPoints(12400)).toBe("12 400");
    expect(formatPoints(850)).toBe("850");
  });

  it("topp 5 visar den egna raden separat när man är utanför", () => {
    const players = [1, 2, 3, 4, 5, 6, 7].map((r) => p(r, r === 7));
    const { rows, meOutside } = topWithMe(players);
    expect(rows).toHaveLength(5);
    expect(meOutside?.rank).toBe(7);
    expect(topWithMe(players.map((x) => ({ ...x, is_me: x.rank === 2 }))).meOutside).toBeNull();
  });

  it("fördelning i procent, även när ingen svarat", () => {
    expect(distributionPercent([1, 3, 0, 0])).toEqual([25, 75, 0, 0]);
    expect(distributionPercent([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("delprovslista", () => {
    expect(kindsText(["ord"])).toBe("ORD");
    expect(kindsText(["ord", "kva", "nog"])).toBe("ORD, KVA och NOG");
  });
});
