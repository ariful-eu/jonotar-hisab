import { describe, expect, it } from "vitest";
import { buildDraftRows, buildExtractionPrompt, parseModelJson } from "../scripts/lib/extract-budget";

describe("buildExtractionPrompt", () => {
  it("names the union, document id and every allowed category so the model can't invent one", () => {
    const p = buildExtractionPrompt({ union: "katuli", docId: "doc-1", fiscalYearHint: "2026-27" });
    expect(p).toContain("katuli");
    expect(p).toContain("doc-1");
    expect(p).toContain("2026-27");
    expect(p).toContain("own_tax");
    expect(p).toContain("JSON");
  });
});

describe("parseModelJson", () => {
  it("extracts a JSON array even when wrapped in prose or a code fence", () => {
    expect(parseModelJson('Here you go:\n```json\n[{"a":1}]\n```\nDone.')).toEqual([{ a: 1 }]);
    expect(parseModelJson('[{"a":1}]')).toEqual([{ a: 1 }]);
  });
  it("throws a clear error when there is no JSON array", () => {
    expect(() => parseModelJson("I could not read this document.")).toThrow(/no JSON array/i);
  });
});

describe("buildDraftRows", () => {
  const base = { head_bn: "বসতবাড়ি কর", head_en: "Holding tax", direction: "income", category: "own_tax", amount: "১,৫৯,২০০/-", kind: "proposed" };

  it("validates and coerces good rows to draft status, tagged to the source document", () => {
    const { rows, errors } = buildDraftRows([base], { union: "katuli", docId: "doc-1", fiscalYear: "2026-27" });
    expect(errors).toEqual([]);
    expect(rows).toEqual([{ union: "katuli", fiscal_year: "2026-27", kind: "proposed", direction: "income", category: "own_tax", head_bn: "বসতবাড়ি কর", head_en: "Holding tax", amount: "159200", source_type: "union", source_doc: "doc-1", status: "draft" }]);
  });

  it("rejects a row with a category the model invented, without dropping the others", () => {
    const { rows, errors } = buildDraftRows([base, { ...base, head_bn: "ঘুষ", category: "bribes" }], { union: "katuli", docId: "doc-1", fiscalYear: "2026-27" });
    expect(rows).toHaveLength(1);
    expect(errors[0]).toMatch(/row 2/);
    expect(errors[0]).toMatch(/category/);
  });

  it("rejects a row with an unparsable amount", () => {
    const { rows, errors } = buildDraftRows([{ ...base, amount: "প্রায় অনেক টাকা" }], { union: "katuli", docId: "doc-1", fiscalYear: "2026-27" });
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/amount/);
  });

  it("rejects a non-array response outright", () => {
    const { rows, errors } = buildDraftRows({ not: "an array" } as never, { union: "katuli", docId: "doc-1", fiscalYear: "2026-27" });
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/array/i);
  });

  it("uses each row's own kind/fiscal year when the document covers more than one column", () => {
    const { rows } = buildDraftRows([{ ...base, kind: "actual", fiscal_year: "2024-25" }], { union: "katuli", docId: "doc-1", fiscalYear: "2026-27" });
    expect(rows[0]).toMatchObject({ kind: "actual", fiscal_year: "2024-25" });
  });
});

import { looksLikeBudgetDoc } from "../scripts/lib/extract-budget";

describe("looksLikeBudgetDoc", () => {
  it("matches a Bangla or English budget filename, and skips other documents", () => {
    expect(looksLikeBudgetDoc({ title_bn: "কাতুলী ইউনিয়ন পরিষদ বাজেট ২০২৬-২৭", url: "https://x.test/a.pdf" })).toBe(true);
    expect(looksLikeBudgetDoc({ title_bn: "নোটিশ", url: "https://x.test/budget-2026.pdf" })).toBe(true);
    expect(looksLikeBudgetDoc({ title_bn: "সরকারী খরচে আইনি সহায়তা প্রদান", url: "https://x.test/a.doc" })).toBe(false);
  });
});

import { mediaTypeForExt, toContentBlock } from "../scripts/lib/extract-budget";

describe("mediaTypeForExt / toContentBlock", () => {
  it("maps known extensions and rejects the rest", () => {
    expect(mediaTypeForExt(".pdf")).toBe("application/pdf");
    expect(mediaTypeForExt(".PNG")).toBe("image/png");
    expect(mediaTypeForExt(".jpg")).toBe("image/jpeg");
    expect(mediaTypeForExt(".docx")).toBeNull();
  });
  it("builds a document block for PDF and an image block otherwise", () => {
    expect(toContentBlock("application/pdf", "AAA")).toEqual({ type: "document", source: { type: "base64", media_type: "application/pdf", data: "AAA" } });
    expect(toContentBlock("image/png", "BBB")).toEqual({ type: "image", source: { type: "base64", media_type: "image/png", data: "BBB" } });
  });
});
