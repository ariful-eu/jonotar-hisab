import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("has the build date define", () => {
    expect(__BUILD_DATE__).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
