import type { BudgetLine, CategoryKey, Kind, ReportedTotal, SourceType } from "../data/schemas";
import { perHousehold } from "./format";

const KIND_PRIORITY: Kind[] = ["actual", "revised", "proposed"];

export type CategoryTotal = { category: CategoryKey; amount: number; lines: BudgetLine[] };
export type YearSummary = {
  union: string;
  fiscalYear: string;
  kind: Kind;
  income: number;
  expense: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
  sourceTypes: SourceType[];
  reportedIncome: number | null;
  reportedExpense: number | null;
};
export type UnionRef = { id: string; name_bn: string; name_en: string; households: number | null };
export type Comparison = { id: string; name_bn: string; name_en: string; fiscalYear: string; kind: Kind; income: number; perHousehold: number | null };

export function yearsFor(lines: BudgetLine[], union: string): string[] {
  return [...new Set(lines.filter((l) => l.union === union).map((l) => l.fiscal_year))].sort().reverse();
}

function group(lines: BudgetLine[]): CategoryTotal[] {
  const byCat = new Map<CategoryKey, CategoryTotal>();
  for (const l of lines) {
    const g = byCat.get(l.category) ?? { category: l.category, amount: 0, lines: [] };
    g.amount += l.amount;
    g.lines.push(l);
    byCat.set(l.category, g);
  }
  return [...byCat.values()].sort((a, b) => b.amount - a.amount);
}

const sum = (xs: BudgetLine[]) => xs.reduce((s, x) => s + x.amount, 0);

export function summarizeYear(lines: BudgetLine[], totals: ReportedTotal[], union: string, fy: string): YearSummary | null {
  const rows = lines.filter((l) => l.union === union && l.fiscal_year === fy);
  const kind = KIND_PRIORITY.find((k) => rows.some((r) => r.kind === k));
  if (!kind) return null;
  const chosen = rows.filter((r) => r.kind === kind);
  const income = chosen.filter((r) => r.direction === "income");
  const expense = chosen.filter((r) => r.direction === "expense");
  const reported = (d: "income" | "expense") =>
    totals.find((t) => t.union === union && t.fiscal_year === fy && t.kind === kind && t.direction === d)?.amount ?? null;
  return {
    union,
    fiscalYear: fy,
    kind,
    income: sum(income),
    expense: sum(expense),
    incomeByCategory: group(income),
    expenseByCategory: group(expense),
    sourceTypes: [...new Set(chosen.map((r) => r.source_type))],
    reportedIncome: reported("income"),
    reportedExpense: reported("expense"),
  };
}

export function compareUnions(lines: BudgetLine[], totals: ReportedTotal[], unions: UnionRef[]): Comparison[] {
  return unions
    .flatMap((u) => {
      const own = lines.filter((l) => l.source_type === "union");
      const fy = yearsFor(own, u.id)[0] ?? yearsFor(lines, u.id)[0];
      const s = fy ? summarizeYear(lines, totals, u.id, fy) : null;
      if (!s) return [];
      const income = s.reportedIncome ?? s.income;
      return [{ id: u.id, name_bn: u.name_bn, name_en: u.name_en, fiscalYear: s.fiscalYear, kind: s.kind, income, perHousehold: perHousehold(income, u.households) }];
    })
    .sort((a, b) => (b.perHousehold ?? -1) - (a.perHousehold ?? -1));
}

export function fiscalYearOf(d: Date): string {
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 6 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function fyStart(fy: string): number {
  return Number(fy.slice(0, 4));
}

export function headlineYear(lines: BudgetLine[], union: string): { year: string | null; newerPartial: string[] } {
  const all = yearsFor(lines, union);
  const full = yearsFor(lines.filter((l) => l.source_type === "union"), union)[0];
  if (!full) return { year: all[0] ?? null, newerPartial: [] };
  return { year: full, newerPartial: all.filter((y) => y > full) };
}
