import { describe, expect, it } from "vitest";
import { checkEligibility, type Answers } from "../app/lib/eligibility";
import type { AllowanceRow } from "../app/data/schemas";

const A = (programme: string, monthly: number | null): AllowanceRow => ({ programme, name_bn: programme, name_en: programme, fiscal_year: "2026-27", monthly_amount: monthly, payment_note_bn: null, eligibility_bn: "x", eligibility_en: "x", selection_bn: "x", selection_en: "x", source_doc: "d" });
const ALL = [A("old-age", 700), A("widow", 700), A("disability", 1000), A("mother-child", 850), A("vwb", null)];
const base: Answers = { age: 40, gender: "female", lowIncome: true, widowed: false, disabilityCard: false, motherOrPregnant: false };
const ids = (a: Answers) => checkEligibility(a, ALL).map((r) => `${r.programme}:${r.level}`);

describe("checkEligibility", () => {
  it("old age: women from 62, men from 65", () => {
    expect(ids({ ...base, age: 62 })).toContain("old-age:likely");
    expect(ids({ ...base, age: 61 })).not.toContain("old-age:likely");
    expect(ids({ ...base, gender: "male", age: 64 })).not.toContain("old-age:likely");
    expect(ids({ ...base, gender: "male", age: 65 })).toContain("old-age:likely");
  });
  it("unknown income gives maybe, not no", () => {
    expect(ids({ ...base, age: 70, lowIncome: null })).toContain("old-age:maybe");
  });
  it("income above the limit excludes income-tested allowances but not disability", () => {
    const r = ids({ ...base, age: 70, lowIncome: false, disabilityCard: true });
    expect(r).not.toContain("old-age:likely");
    expect(r).toContain("disability:likely");
  });
  it("widow allowance only for women 18+ who are widowed or deserted", () => {
    expect(ids({ ...base, widowed: true })).toContain("widow:likely");
    expect(ids({ ...base, widowed: true, gender: "male" })).not.toContain("widow:likely");
    expect(ids({ ...base, widowed: true, age: 17 })).not.toContain("widow:likely");
  });
  it("mother and child benefit", () => {
    expect(ids({ ...base, motherOrPregnant: true })).toContain("mother-child:likely");
  });
  it("carries the monthly amount from the allowance data", () => {
    expect(checkEligibility({ ...base, age: 70 }, ALL).find((r) => r.programme === "old-age")?.monthly).toBe(700);
  });
  it("returns nothing when no rule matches", () => {
    expect(checkEligibility({ ...base, gender: "male" }, ALL)).toEqual([]);
  });
});
