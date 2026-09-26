import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { z } from "zod";
import * as S from "./schemas";

export class DataError extends Error {
  override name = "DataError";
}

export function parseCsv<T>(file: string, text: string, schema: z.ZodType<T>, draftField = "status"): T[] {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (res.errors.length > 0) {
    const e = res.errors[0];
    throw new DataError(`${file} row ${(e.row ?? 0) + 2}: ${e.message}`);
  }
  const out: T[] = [];
  res.data.forEach((raw, i) => {
    if ((raw[draftField] ?? "").trim() === "draft") return;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const col = String(issue.path[0] ?? "?");
      throw new DataError(`${file} row ${i + 2}, column ${col}: ${issue.message} (got ${JSON.stringify(raw[col] ?? "")})`);
    }
    out.push(parsed.data);
  });
  return out;
}

export function checkRefs(ds: S.Dataset): string[] {
  const errs: string[] = [];
  const docIds = new Set(ds.documents.map((d) => d.id));
  const projectIds = new Set(ds.projects.map((p) => p.id));
  const unionIds = new Set([ds.union.id, ...ds.union.comparisons.map((c) => c.id)]);
  const doc = (file: string, id: string | null) => {
    if (id !== null && !docIds.has(id)) errs.push(`${file}: source_doc "${id}" not found in documents.csv`);
  };
  const dupes = (file: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${file}: duplicate id "${id}"`);
      seen.add(id);
    }
  };
  dupes("documents.csv", ds.documents.map((d) => d.id));
  dupes("projects.csv", ds.projects.map((p) => p.id));
  dupes("tenders.csv", ds.tenders.map((t) => t.id));
  dupes("disclosures.csv", ds.disclosures.map((d) => d.id));
  for (const l of ds.budget) {
    doc("budget_lines.csv", l.source_doc);
    if (!unionIds.has(l.union)) errs.push(`budget_lines.csv: union "${l.union}" is not katuli or listed in union.json comparisons`);
  }
  for (const t of ds.reportedTotals) {
    doc("budget_reported_totals.csv", t.source_doc);
    if (!unionIds.has(t.union)) errs.push(`budget_reported_totals.csv: union "${t.union}" unknown`);
  }
  ds.projects.forEach((p) => doc("projects.csv", p.source_doc));
  ds.fees.forEach((f) => doc("service_fees.csv", f.source_doc));
  ds.allowances.forEach((a) => doc("allowances.csv", a.source_doc));
  ds.allowanceCounts.forEach((a) => doc("allowance_counts.csv", a.source_doc));
  ds.disclosures.forEach((d) => doc("disclosures.csv", d.document_id));
  for (const v of ds.verifications) {
    if (!projectIds.has(v.project_id)) errs.push(`verifications.csv: project_id "${v.project_id}" not found in projects.csv`);
  }
  for (const t of ds.tenders) {
    if (t.project_id !== null && !projectIds.has(t.project_id)) errs.push(`tenders.csv: project_id "${t.project_id}" not found in projects.csv`);
  }
  return errs;
}

let cache: { dir: string; ds: S.Dataset } | null = null;

export function loadDataset(dir = path.resolve(process.cwd(), "data")): S.Dataset {
  if (cache && cache.dir === dir) return cache.ds;
  const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");
  const union = S.UnionProfile.safeParse(JSON.parse(read("union.json")));
  if (!union.success) {
    const issue = union.error.issues[0];
    throw new DataError(`union.json ${issue.path.join(".")}: ${issue.message}`);
  }
  const ds: S.Dataset = {
    union: union.data,
    documents: parseCsv("documents.csv", read("documents.csv"), S.DocumentRow),
    disclosures: parseCsv("disclosures.csv", read("disclosures.csv"), S.DisclosureRow, "-"),
    budget: parseCsv("budget_lines.csv", read("budget_lines.csv"), S.BudgetLine),
    reportedTotals: parseCsv("budget_reported_totals.csv", read("budget_reported_totals.csv"), S.ReportedTotal, "-"),
    projects: parseCsv("projects.csv", read("projects.csv"), S.ProjectRow, "status_row"),
    verifications: parseCsv("verifications.csv", read("verifications.csv"), S.VerificationRow),
    tenders: parseCsv("tenders.csv", read("tenders.csv"), S.TenderRow),
    fees: parseCsv("service_fees.csv", read("service_fees.csv"), S.ServiceFeeRow, "-"),
    allowances: parseCsv("allowances.csv", read("allowances.csv"), S.AllowanceRow, "-"),
    allowanceCounts: parseCsv("allowance_counts.csv", read("allowance_counts.csv"), S.AllowanceCountRow),
  };
  const errs = checkRefs(ds);
  if (errs.length > 0) throw new DataError(errs.join("\n"));
  if (process.env.NODE_ENV === "production") cache = { dir, ds };
  return ds;
}
