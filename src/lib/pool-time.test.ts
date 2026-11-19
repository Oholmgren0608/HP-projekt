import { describe, expect, it } from "vitest";
import { CLOSED_POOL_KINDS, POOL_KINDS, isClosedPoolKind, isPoolKind, poolTimeLimitMs } from "./pool-time";

describe("tid per fråga i tävlingslägena", () => {
  it("följer delprovet (samma värden som pool_time_limit_ms i 0037)", () => {
    expect(poolTimeLimitMs("ord")).toBe(20_000);
    expect(poolTimeLimitMs("kva")).toBe(75_000);
    expect(poolTimeLimitMs("xyz")).toBe(90_000);
    expect(poolTimeLimitMs("nog")).toBe(90_000);
  });

  it("spelen har ORD, XYZ, KVA och NOG; MEK, DTK, LÄS och ELF ingår inte (0043)", () => {
    expect([...POOL_KINDS]).toEqual(["ord", "xyz", "kva", "nog"]);
    for (const kind of ["mek", "dtk", "las", "elf"]) expect(isPoolKind(kind)).toBe(false);
    expect(poolTimeLimitMs("dtk")).toBe(60_000);
  });

  it("den stängda spelpoolen tar bara ORD (kvantfrågorna i spelen är UHR-frågor, 0041)", () => {
    expect([...CLOSED_POOL_KINDS]).toEqual(["ord"]);
    for (const kind of ["mek", "xyz", "kva", "nog", "dtk", "las", "elf"]) expect(isClosedPoolKind(kind)).toBe(false);
    expect(CLOSED_POOL_KINDS.every((k) => isPoolKind(k))).toBe(true);
  });
});
