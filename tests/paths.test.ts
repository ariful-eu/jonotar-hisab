import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "../app/data/load.server";
import { allPaths } from "../app/data/paths";

describe("allPaths", () => {
  it("includes every static section, every ward and every dynamic record without duplicates", () => {
    const ds = loadDataset(path.resolve("data"));
    const paths = allPaths(ds);
    for (const p of ["/", "/budget", "/wards", "/projects", "/tenders", "/services", "/allowances", "/rights", "/documents", "/about", "/poster/home/katuli"]) {
      expect(paths).toContain(p);
    }
    for (let n = 1; n <= 9; n++) expect(paths).toContain(`/ward/${n}`);
    for (const p of ds.projects) expect(paths).toContain(`/projects/${p.id}`);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
