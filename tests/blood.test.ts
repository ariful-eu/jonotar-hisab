import { describe, expect, it } from "vitest";
import { BLOOD_GROUPS, canDonateTo, canGiveTo, canReceiveFrom, normalizeGroup, parseGroupsCsv } from "../app/lib/blood";

describe("canDonateTo", () => {
  it("O- gives to everyone; AB+ receives from everyone", () => {
    expect(canGiveTo("O-")).toEqual([...BLOOD_GROUPS]);
    expect(canReceiveFrom("AB+")).toEqual([...BLOOD_GROUPS]);
  });
  it("AB+ gives only to AB+; O- receives only from O-", () => {
    expect(canGiveTo("AB+")).toEqual(["AB+"]);
    expect(canReceiveFrom("O-")).toEqual(["O-"]);
  });
  it("Rh-negative patients never receive Rh-positive blood", () => {
    for (const d of BLOOD_GROUPS) for (const r of BLOOD_GROUPS) {
      if (d.endsWith("+") && r.endsWith("-")) expect(canDonateTo(d, r)).toBe(false);
    }
  });
  it("matches the standard table", () => {
    expect(canReceiveFrom("A+")).toEqual(["A+", "A-", "O+", "O-"]);
    expect(canReceiveFrom("B-")).toEqual(["B-", "O-"]);
    expect(canGiveTo("A-")).toEqual(["A+", "A-", "AB+", "AB-"]);
    // 64 pairs: count of compatible pairs in the standard ABO/Rh table
    const n = BLOOD_GROUPS.flatMap((d) => BLOOD_GROUPS.map((r) => canDonateTo(d, r))).filter(Boolean).length;
    expect(n).toBe(27);
  });
});

describe("normalizeGroup", () => {
  it("accepts common spellings", () => {
    expect(normalizeGroup(" a + ")).toBe("A+");
    expect(normalizeGroup("AB−")).toBe("AB-");
    expect(normalizeGroup("O neg")).toBe("O-");
    expect(normalizeGroup("B positive")).toBe("B+");
    expect(normalizeGroup("এবি+")).toBe("AB+");
    expect(normalizeGroup("ও নেগেটিভ")).toBe("O-");
    expect(normalizeGroup("জানি না")).toBeNull();
    expect(normalizeGroup("C+")).toBeNull();
  });
});

describe("parseGroupsCsv", () => {
  it("reads group/available and leaves missing groups unknown", () => {
    const r = parseGroupsCsv("﻿group,available\r\nA+,yes\nO-,no\nB+,TRUE\n");
    expect(r["A+"]).toBe(true);
    expect(r["O-"]).toBe(false);
    expect(r["B+"]).toBe(true);
    expect(r["AB-"]).toBeNull();
  });
  it("ignores every other column, so personal data can never be shown", () => {
    const r = parseGroupsCsv('name,phone,group,available\n"Rahim, Md",01700000000,A+,yes\n');
    expect(r["A+"]).toBe(true);
    expect(JSON.stringify(r)).not.toContain("0170");
    expect(JSON.stringify(r)).not.toContain("Rahim");
  });
  it("returns all unknown for an empty sheet, a wrong header or an HTML error page", () => {
    for (const text of ["", "group,available", "foo,bar\nA+,yes", "<html><body>Error</body></html>"]) {
      expect(Object.values(parseGroupsCsv(text)).every((v) => v === null)).toBe(true);
    }
  });
  it("treats unclear values as unknown, not as unavailable", () => {
    expect(parseGroupsCsv("group,available\nA+,maybe\nB+,\n")["A+"]).toBeNull();
  });
});
