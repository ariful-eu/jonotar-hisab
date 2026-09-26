import { describe, expect, it } from "vitest";
import { filterProjects } from "../app/lib/projects";
import type { ProjectRow } from "../app/data/schemas";

const P = (o: Partial<ProjectRow>): ProjectRow => ({ id: "p", fiscal_year: null, name_bn: "প", name_en: null, scheme: "adp", ward: 1, village_bn: null, lat: null, lng: null, amount: null, unit_of_work_bn: null, implementer_bn: null, start: null, end: null, status: "unknown", source_type: "union", source_doc: "d", up_reply_bn: null, status_row: "published", ...o });

describe("filterProjects", () => {
  const list = [P({ id: "a", ward: 1, scheme: "adp" }), P({ id: "b", ward: 2, scheme: "tr", status: "completed" }), P({ id: "c", ward: null, scheme: "tr" })];
  it("returns all when filters are empty", () => {
    expect(filterProjects(list, { ward: "", scheme: "", status: "" }).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
  it("combines filters", () => {
    expect(filterProjects(list, { ward: "", scheme: "tr", status: "" }).map((p) => p.id)).toEqual(["b", "c"]);
    expect(filterProjects(list, { ward: "2", scheme: "tr", status: "completed" }).map((p) => p.id)).toEqual(["b"]);
  });
  it("supports the 'no ward' option", () => {
    expect(filterProjects(list, { ward: "none", scheme: "", status: "" }).map((p) => p.id)).toEqual(["c"]);
  });
});
