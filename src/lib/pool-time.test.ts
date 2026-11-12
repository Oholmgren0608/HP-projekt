import { describe, expect, it } from "vitest";
import { CLOSED_POOL_KINDS, POOL_KINDS, isClosedPoolKind, isPoolKind, poolTimeLimitMs } from "./pool-time";

describe("tid per fråga i tävlingslägena", () => {
  it("följer delprovet (samma värden som pool_time_limit_ms i 0037)", () => {
    expect(poolTimeLimitMs("ord")).toBe(20_000);
    expect(poolTimeLimitMs("mek")).toBe(45_000);
    expect(poolTimeLimitMs("kva")).toBe(75_000);
    expect(poolTimeLimitMs("xyz")).toBe(90_000);
    expect(poolTimeLimitMs("nog")).toBe(90_000);
  });

  it("DTK, LÄS och ELF ingår inte", () => {
    expect(POOL_KINDS).not.toContain("dtk");
    expect(isPoolKind("dtk")).toBe(false);
    expect(isPoolKind("las")).toBe(false);
    expect(isPoolKind("elf")).toBe(false);
    expect(poolTimeLimitMs("dtk")).toBe(60_000);
  });

  it("den stängda spelpoolen tar bara ORD och MEK (kvantfrågorna i spelen är UHR-frågor, 0041)", () => {
    expect([...CLOSED_POOL_KINDS]).toEqual(["ord", "mek"]);
    for (const kind of ["xyz", "kva", "nog", "dtk", "las", "elf"]) expect(isClosedPoolKind(kind)).toBe(false);
    expect(CLOSED_POOL_KINDS.every((k) => isPoolKind(k))).toBe(true);
  });
});
