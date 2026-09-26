import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __BUILD_DATE__: JSON.stringify("2026-09-26") },
  test: { environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}"], setupFiles: ["tests/setup.ts"] },
});
