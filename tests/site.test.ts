import { describe, expect, it } from "vitest";
import { absoluteUrl } from "../app/lib/site";

describe("absoluteUrl", () => {
  it("falls back to localhost when no site URL is configured", () => {
    expect(absoluteUrl("/ward/3")).toBe("http://localhost:5173/ward/3");
  });
});
