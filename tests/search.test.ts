import { describe, expect, it } from "vitest";
import { normalize, searchIndex, type SearchEntry } from "../app/lib/search";

const E: SearchEntry[] = [
  { title_bn: "জন্ম নিবন্ধন", title_en: "Birth registration", keywords: "birth certificate জন্ম সনদ", url: "/services/birth-registration", kind: "service" },
  { title_bn: "বয়স্ক ভাতা", title_en: "Old-age allowance", keywords: "ভাতা বয়স্ক", url: "/allowances", kind: "page" },
  { title_bn: "জরুরি নম্বর", title_en: "Emergency numbers", keywords: "999 পুলিশ", url: "/contacts", kind: "page" },
];

describe("search", () => {
  it("finds Bangla by prefix", () => {
    expect(searchIndex(E, "জন্ম")[0].url).toBe("/services/birth-registration");
  });
  it("finds English case-insensitively", () => {
    expect(searchIndex(E, "BIRTH")[0].url).toBe("/services/birth-registration");
  });
  it("matches keywords and numbers", () => {
    expect(searchIndex(E, "৯৯৯")[0].url).toBe("/contacts");
    expect(searchIndex(E, "999")[0].url).toBe("/contacts");
  });
  it("treats precomposed and decomposed য় the same", () => {
    expect(normalize("বয়স্ক")).toBe(normalize("বয়স্ক"));
    expect(searchIndex(E, "বয়স্ক")[0].url).toBe("/allowances");
  });
  it("returns nothing for empty or unmatched queries", () => {
    expect(searchIndex(E, "  ")).toEqual([]);
    expect(searchIndex(E, "zzzz")).toEqual([]);
  });
});
