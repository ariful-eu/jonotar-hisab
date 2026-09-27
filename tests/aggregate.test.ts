import { describe, expect, it } from "vitest";
import { compareUnions, fiscalYearOf, fyStart, headlineYear, summarizeYear, yearsFor } from "../app/lib/aggregate";
import type { BudgetLine, ReportedTotal } from "../app/data/schemas";

const L = (o: Partial<BudgetLine>): BudgetLine => ({ union: "katuli", fiscal_year: "2014-15", kind: "proposed", direction: "income", category: "own_tax", head_bn: "ক", head_en: null, amount: 100, source_type: "union", source_doc: "d", status: "published", ...o });

const lines: BudgetLine[] = [
  L({ amount: 100 }),
  L({ category: "adp", amount: 300 }),
  L({ direction: "expense", category: "roads", amount: 250 }),
  L({ kind: "actual", fiscal_year: "2012-13", amount: 50 }),
  L({ kind: "proposed", fiscal_year: "2012-13", amount: 999 }),
  L({ union: "silimpur", fiscal_year: "2023-24", amount: 1000 }),
];
const totals: ReportedTotal[] = [{ union: "katuli", fiscal_year: "2014-15", kind: "proposed", direction: "income", amount: 406, source_doc: "d" }];

describe("yearsFor", () => {
  it("lists a union's years newest first", () => {
    expect(yearsFor(lines, "katuli")).toEqual(["2014-15", "2012-13"]);
    expect(yearsFor(lines, "nobody")).toEqual([]);
  });
});

describe("summarizeYear", () => {
  it("sums by direction and groups categories largest first", () => {
    const s = summarizeYear(lines, totals, "katuli", "2014-15")!;
    expect(s.income).toBe(400);
    expect(s.expense).toBe(250);
    expect(s.incomeByCategory.map((c) => c.category)).toEqual(["adp", "own_tax"]);
    expect(s.reportedIncome).toBe(406);
    expect(s.reportedExpense).toBeNull();
    expect(s.sourceTypes).toEqual(["union"]);
  });
  it("prefers actual over proposed figures for the same year", () => {
    const s = summarizeYear(lines, totals, "katuli", "2012-13")!;
    expect(s.kind).toBe("actual");
    expect(s.income).toBe(50);
  });
  it("returns null for a year with no data", () => {
    expect(summarizeYear(lines, totals, "katuli", "2026-27")).toBeNull();
  });
});

describe("compareUnions", () => {
  it("uses the latest year, prefers reported totals, and handles unknown households", () => {
    const rows = compareUnions(lines, totals, [
      { id: "katuli", name_bn: "কাতুলী", name_en: "Katuli", households: 4 },
      { id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", households: null },
      { id: "nodata", name_bn: "ক", name_en: "X", households: 10 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "katuli", fiscalYear: "2014-15", income: 406, perHousehold: 102 });
    expect(rows[1]).toMatchObject({ id: "silimpur", perHousehold: null });
  });
});

describe("compareUnions with partial upstream years", () => {
  it("prefers the latest year that has the union's own budget over a newer partial upstream year", () => {
    const withUpstream = [...lines, L({ fiscal_year: "2026-27", kind: "actual", category: "block_grant", amount: 5, source_type: "upstream" })];
    const rows = compareUnions(withUpstream, totals, [{ id: "katuli", name_bn: "কাতুলী", name_en: "Katuli", households: 4 }]);
    expect(rows[0]).toMatchObject({ fiscalYear: "2014-15", income: 406 });
  });
});

describe("fiscal years", () => {
  it("July starts a new fiscal year", () => {
    expect(fiscalYearOf(new Date("2026-06-30T12:00:00Z"))).toBe("2025-26");
    expect(fiscalYearOf(new Date("2026-07-01T12:00:00Z"))).toBe("2026-27");
    expect(fiscalYearOf(new Date("2099-09-01T12:00:00Z"))).toBe("2099-00");
    expect(fyStart("2014-15")).toBe(2014);
  });
});

describe("headlineYear", () => {
  it("uses the latest full budget and reports newer partial years separately", () => {
    const withUpstream = [...lines, L({ fiscal_year: "2026-27", kind: "actual", amount: 5, source_type: "upstream" })];
    expect(headlineYear(withUpstream, "katuli")).toEqual({ year: "2014-15", newerPartial: ["2026-27"] });
  });
  it("falls back to the latest partial year when no full budget exists", () => {
    const only = [L({ fiscal_year: "2026-27", source_type: "upstream" })];
    expect(headlineYear(only, "katuli")).toEqual({ year: "2026-27", newerPartial: [] });
    expect(headlineYear([], "katuli")).toEqual({ year: null, newerPartial: [] });
  });
});
