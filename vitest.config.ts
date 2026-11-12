import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Datumnycklar (dagens uppdrag, streak) räknas i lokal tid.
    env: { TZ: "UTC" },
    restoreMocks: true,
    // Synk- och frågebankstesterna laddar den bundlade banken (över 4 MB med
    // UHR-frågorna); på en belastad CI-maskin räcker inte standardens 5 s.
    testTimeout: 30_000,
  },
});
