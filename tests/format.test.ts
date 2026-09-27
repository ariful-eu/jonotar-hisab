import { describe, expect, it } from "vitest";
import { formatDate, formatFy, formatNumber, formatTaka, formatTakaFull, parseAmount, perHousehold, toBnDigits, toEnDigits } from "../app/lib/format";

describe("digits", () => {
  it("converts both ways", () => {
    expect(toBnDigits("2014-15")).toBe("২০১৪-১৫");
    expect(toEnDigits("১২,৩৪৫")).toBe("12,345");
  });
});

describe("parseAmount", () => {
  it("accepts Bangla digits, commas, taka sign and word", () => {
    expect(parseAmount("৳১২,৩৪৫")).toBe(12345);
    expect(parseAmount("১২,৩৪৫ টাকা")).toBe(12345);
    expect(parseAmount(" 1,59,200 ")).toBe(159200);
    expect(parseAmount("Tk. 500")).toBe(500);
    expect(parseAmount("24.25")).toBe(24.25);
    expect(parseAmount("৪৪,৯২,৩৮৭/-")).toBe(4492387);
    expect(parseAmount("=১,৫৯,২০০/-")).toBe(159200);
  });
  it("returns null for blanks and dashes", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("-")).toBeNull();
    expect(parseAmount("–")).toBeNull();
  });
  it("returns NaN for garbage", () => {
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("১২ লাখ")).toBeNaN();
  });
});

describe("formatTaka", () => {
  it("uses crore/lakh in Bangla", () => {
    expect(formatTaka(18442514, "bn")).toBe("৳১.৮ কোটি");
    expect(formatTaka(1572643, "bn")).toBe("৳১৫.৭ লাখ");
    expect(formatTaka(100000, "bn")).toBe("৳১ লাখ");
    expect(formatTaka(30000, "bn")).toBe("৳৩০,০০০");
  });
  it("uses Tk + lakh in English", () => {
    expect(formatTaka(1572643, "en")).toBe("Tk 15.7 lakh");
    expect(formatTaka(30000, "en")).toBe("Tk 30,000");
  });
  it("full format keeps every digit with lakh grouping", () => {
    expect(formatTakaFull(9458058, "bn")).toBe("৳৯৪,৫৮,০৫৮");
    expect(formatNumber(1234567, "en")).toBe("12,34,567");
  });
});

describe("dates and years", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-09-26", "en")).toBe("26 September 2026");
    expect(formatDate("2026-09-26", "bn")).toContain("২০২৬");
  });
  it("formats fiscal years", () => {
    expect(formatFy("2026-27", "bn")).toBe("২০২৬-২৭");
  });
});

describe("perHousehold", () => {
  it("divides and rounds", () => {
    expect(perHousehold(9458058, 6433)).toBe(1470);
  });
  it("returns null when households unknown or zero", () => {
    expect(perHousehold(100, null)).toBeNull();
    expect(perHousehold(100, 0)).toBeNull();
    expect(perHousehold(100, undefined)).toBeNull();
  });
});
