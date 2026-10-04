import { afterEach, describe, expect, it, vi } from "vitest";
import { telHref } from "../app/lib/contacts";
import { noticesFeed } from "../app/lib/notices";
import { getMyWard, setMyWard } from "../app/lib/prefs";
import type { DocumentRow, TenderRow } from "../app/data/schemas";

describe("telHref", () => {
  it("keeps only digits and a leading +", () => {
    expect(telHref("০১৭১১-২২২ ৩৩৩")).toBe("tel:01711222333");
    expect(telHref("+880 2-9512345")).toBe("tel:+88029512345");
    expect(telHref("999")).toBe("tel:999");
  });
});

const D = (o: Partial<DocumentRow>): DocumentRow => ({ id: "d", title_bn: "ক", title_en: null, issuer: "union", date: null, fiscal_year: null, url: null, archive_path: null, reliability: "official", status: "published", note_bn: null, ...o });
const T = (o: Partial<TenderRow>): TenderRow => ({ id: "t", title_bn: "টেন্ডার", title_en: null, issuer: "LGED", ref_no: null, published: "2026-07-28", deadline: null, est_value: null, url: null, archive_path: null, awarded_to: null, award_value: null, project_id: null, status: "published", ...o });

describe("noticesFeed", () => {
  it("lists only scraper-found notices plus tenders, newest first, undated last", () => {
    const feed = noticesFeed(
      [
        D({ id: "katuli-notices-aa", date: "2025-01-01" }),
        D({ id: "sadar-notices-bb", issuer: "upazila", date: "2026-09-01" }),
        D({ id: "district-notices-cc", issuer: "district", date: null }),
        D({ id: "tsadar-hospitals", issuer: "upazila", date: "2026-10-01" }),
        D({ id: "katuli-budget-2014-15", date: "2014-12-08" }),
        D({ id: "katuli-files-dd", status: "ignored", date: "2026-09-02" }),
      ],
      [T({ id: "t1", published: "2026-07-28" })],
    );
    expect(feed.map((x) => x.id)).toEqual(["sadar-notices-bb", "t1", "katuli-notices-aa", "district-notices-cc"]);
    expect(feed.find((x) => x.id === "t1")?.url).toBe("/tenders/t1");
  });
});

describe("prefs", () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
  it("saves and reads my ward", () => {
    setMyWard(4);
    expect(getMyWard()).toBe(4);
    setMyWard(null);
    expect(getMyWard()).toBeNull();
  });
  it("ignores invalid stored values and storage errors", () => {
    localStorage.setItem("katuli-my-ward", "99");
    expect(getMyWard()).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    expect(getMyWard()).toBeNull();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    expect(() => setMyWard(3)).not.toThrow();
  });
});
