import { describe, expect, it } from "vitest";
import { POOL_KINDS, isPoolKind, poolTimeLimitMs } from "./pool-time";

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
});
