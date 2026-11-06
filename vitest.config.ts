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
  },
});
