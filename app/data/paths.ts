import { RIGHTS_TOPICS } from "../content/rights";
import { yearsFor } from "../lib/aggregate";
import type { Dataset } from "./schemas";

export function allPaths(ds: Dataset): string[] {
  const wards = ds.union.wards.map((w) => w.no);
  return [
    ...new Set([
      "/",
      "/budget",
      ...yearsFor(ds.budget, ds.union.id).map((y) => `/budget/${y}`),
      "/wards",
      ...wards.map((n) => `/ward/${n}`),
      "/projects",
      ...ds.projects.map((p) => `/projects/${p.id}`),
      "/tenders",
      ...ds.tenders.map((t) => `/tenders/${t.id}`),
      "/services",
      "/allowances",
      "/rights",
      ...RIGHTS_TOPICS.map((t) => `/rights/${t.key}`),
      "/documents",
      "/about",
      `/poster/home/${ds.union.id}`,
      ...wards.map((n) => `/poster/ward/${n}`),
      ...ds.projects.map((p) => `/poster/project/${p.id}`),
    ]),
  ];
}
