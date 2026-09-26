import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "../app/data/load.server";

describe("real data/ folder", () => {
  it("loads and validates without errors", () => {
    const ds = loadDataset(path.resolve("data"));
    expect(ds.union.id).toBe("katuli");
    expect(ds.union.wards).toHaveLength(9);
  });
});
