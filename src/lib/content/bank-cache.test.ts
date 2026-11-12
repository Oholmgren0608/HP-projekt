import { describe, expect, it } from "vitest";
import { readCacheValue, writeCacheValue } from "./bank-cache";

describe("bank-cache utan IndexedDB", () => {
  it("ger ingen cache i stället för att kasta (t.ex. privat läge)", async () => {
    expect(typeof indexedDB).toBe("undefined");
    await expect(readCacheValue("hp-lift-questions-v5")).resolves.toBeNull();
    await expect(writeCacheValue("hp-lift-questions-v5", { questions: [] })).resolves.toBe(false);
  });
});
