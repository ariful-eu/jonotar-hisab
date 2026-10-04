import type { AllowanceRow } from "../data/schemas";

export type Answers = {
  age: number;
  gender: "male" | "female" | "other";
  lowIncome: boolean | null;
  widowed: boolean;
  disabilityCard: boolean;
  motherOrPregnant: boolean;
};
export type EligibilityResult = { programme: string; level: "likely" | "maybe"; monthly: number | null; row: AllowanceRow };

type Rule = (a: Answers) => boolean;
const RULES: Record<string, { rule: Rule; incomeTested: boolean }> = {
  "old-age": { rule: (a) => a.age >= (a.gender === "male" ? 65 : 62), incomeTested: true },
  widow: { rule: (a) => a.gender === "female" && a.age >= 18 && a.widowed, incomeTested: true },
  disability: { rule: (a) => a.disabilityCard, incomeTested: false },
  "mother-child": { rule: (a) => a.motherOrPregnant, incomeTested: true },
};

export function checkEligibility(a: Answers, allowances: AllowanceRow[]): EligibilityResult[] {
  return allowances.flatMap((row) => {
    const r = RULES[row.programme];
    if (!r || !r.rule(a)) return [];
    if (r.incomeTested && a.lowIncome === false) return [];
    const level = r.incomeTested && a.lowIncome === null ? "maybe" : "likely";
    return [{ programme: row.programme, level, monthly: row.monthly_amount, row }];
  });
}
