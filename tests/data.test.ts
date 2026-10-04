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

describe("auto-added LGED records", () => {
  it("are merged from *_auto.csv and linked tender → project → document", () => {
    const ds = loadDataset(path.resolve("data"));
    const t = ds.tenders.find((x) => x.id === "lged-tender-1306710");
    expect(t?.deadline).toBe("2026-08-10");
    expect(ds.projects.find((p) => p.id === "lged-1306710")?.lat).toBe(24.2217);
    expect(ds.tenders.filter((x) => x.id.startsWith("lged-tender-")).length).toBeGreaterThanOrEqual(3);
    expect(ds.tenders.some((x) => x.id.startsWith("lged-47-") || x.id.startsWith("lged-04-"))).toBe(false);
  });
});

import { SERVICE_GUIDES } from "../app/content/service-guides";

describe("service guides", () => {
  it("every fee id and source document exists, and ids are unique", () => {
    const ds = loadDataset(path.resolve("data"));
    const fees = new Set(ds.fees.map((f) => f.id));
    const docs = new Set(ds.documents.map((d) => d.id));
    for (const g of SERVICE_GUIDES) {
      for (const id of g.fee_ids) expect(fees, `${g.id} fee ${id}`).toContain(id);
      for (const id of g.source_docs) expect(docs, `${g.id} source ${id}`).toContain(id);
      expect(g.papers.length + g.steps.length).toBeGreaterThan(0);
    }
    expect(new Set(SERVICE_GUIDES.map((g) => g.id)).size).toBe(SERVICE_GUIDES.length);
  });
});
