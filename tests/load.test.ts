import { describe, expect, it } from "vitest";
import { checkRefs, DataError, parseCsv } from "../app/data/load.server";
import { BudgetLine, type Dataset } from "../app/data/schemas";

const header = "union,fiscal_year,kind,direction,category,head_bn,head_en,amount,source_type,source_doc,status";

describe("parseCsv", () => {
  it("parses valid rows including Bangla digits", () => {
    const rows = parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,own_tax,বসতবাড়ি কর,Holding tax,"৳১,৫৯,২০০",union,doc-a,published\n`, BudgetLine);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(159200);
  });

  it("skips draft rows entirely, even invalid ones", () => {
    const rows = parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,own_tax,x,,notanumber,union,doc-a,draft\n`, BudgetLine);
    expect(rows).toHaveLength(0);
  });

  it("reports file, row and column for bad values", () => {
    const bad = `${header}\nkatuli,2014-15,proposed,income,own_tax,a,,100,union,doc-a,published\nkatuli,2014-15,proposed,income,own_tax,b,,abc,union,doc-a,published\n`;
    expect(() => parseCsv("budget_lines.csv", bad, BudgetLine)).toThrowError(DataError);
    expect(() => parseCsv("budget_lines.csv", bad, BudgetLine)).toThrowError(/budget_lines\.csv row 3, column amount: .*\(got "abc"\)/);
  });

  it("rejects unknown categories", () => {
    expect(() => parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,bribes,a,,1,union,doc-a,published\n`, BudgetLine)).toThrowError(/column category/);
  });

  it("strips a UTF-8 BOM from Excel exports", () => {
    const rows = parseCsv("budget_lines.csv", `﻿${header}\nkatuli,2014-15,proposed,income,own_tax,a,,1,union,doc-a,published\n`, BudgetLine);
    expect(rows[0].union).toBe("katuli");
  });
});

function makeDs(over: Partial<Dataset> = {}): Dataset {
  return {
    union: {
      id: "katuli", name_bn: "কাতুলী", name_en: "Katuli", upazila_bn: "টাঙ্গাইল সদর", upazila_en: "Tangail Sadar", district_bn: "টাঙ্গাইল", district_en: "Tangail",
      area_km2: 26.92, population: 29811, households: 6433, census_year: 2011, portal_url: "https://example.org/", villages_bn: [], villages_en: [],
      wards: [], leadership: [], maintainer: { whatsapp: null, note_bn: null }, comparisons: [{ id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", population: null, households: null, census_year: null, portal_url: null }],
    },
    documents: [{ id: "doc-a", title_bn: "ক", title_en: null, issuer: "union", date: null, fiscal_year: null, url: null, archive_path: null, reliability: "official", status: "published", note_bn: null }],
    disclosures: [], budget: [], reportedTotals: [], projects: [], verifications: [], tenders: [], fees: [], allowances: [], allowanceCounts: [],
    ...over,
  };
}

describe("checkRefs", () => {
  it("passes a consistent dataset", () => {
    expect(checkRefs(makeDs())).toEqual([]);
  });
  it("flags missing source documents and unknown unions", () => {
    const errs = checkRefs(makeDs({ budget: [{ union: "nowhere", fiscal_year: "2014-15", kind: "proposed", direction: "income", category: "own_tax", head_bn: "ক", head_en: null, amount: 1, source_type: "union", source_doc: "missing", status: "published" }] }));
    expect(errs.join("\n")).toMatch(/source_doc "missing"/);
    expect(errs.join("\n")).toMatch(/union "nowhere"/);
  });
  it("flags verifications for unknown projects and duplicate ids", () => {
    const errs = checkRefs(makeDs({
      documents: [...makeDs().documents, ...makeDs().documents],
      verifications: [{ project_id: "ghost", visit_date: "2026-09-01", visitor: "volunteer", observed_status: "unclear", observation_bn: "x", photo_paths: [], measured: null, status: "published" }],
    }));
    expect(errs.join("\n")).toMatch(/duplicate id "doc-a"/);
    expect(errs.join("\n")).toMatch(/project_id "ghost"/);
  });
});
