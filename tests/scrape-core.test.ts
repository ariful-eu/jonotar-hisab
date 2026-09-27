import { describe, expect, it } from "vitest";
import { appendRows, draftDocumentRow, extractLinks, isFileUrl, knownUrls } from "../scripts/lib/scrape-core";

const html = `<html><body>
  <a href="/pages/notices/abc">বাজেট সভার নোটিশ</a>
  <a href="https://objectstorage.example/office-katuliup/2026/x.pdf">  বাজেট ২০২৬-২৭ </a>
  <a href="/pages/notices/abc">duplicate</a>
  <a href="#top">top</a>
  <a href="javascript:void(0)">js</a>
  <a href="/pages/officers">officers</a>
</body></html>`;

describe("extractLinks", () => {
  it("resolves relative URLs, trims text, filters by pattern and dedupes", () => {
    const links = extractLinks(html, "https://katuliup.tangail.gov.bd/pages/notices", "/notices/|\\.pdf$");
    expect(links).toEqual([
      { url: "https://katuliup.tangail.gov.bd/pages/notices/abc", text: "বাজেট সভার নোটিশ" },
      { url: "https://objectstorage.example/office-katuliup/2026/x.pdf", text: "বাজেট ২০২৬-২৭" },
    ]);
  });
  it("uses the table row text when the link text is a generic 'view' label", () => {
    const table = `<table><tr><td>১</td><td>বাজেট সভার নোটিশ ২০২৬-২৭</td><td>২০২৬-০৫-০১</td><td><a href="/pages/notices/x1">দেখুন</a></td></tr></table>`;
    expect(extractLinks(table, "https://a.test/pages/notices", "/notices/")[0].text).toBe("১ বাজেট সভার নোটিশ ২০২৬-২৭ ২০২৬-০৫-০১");
  });
  it("returns nothing for empty or changed HTML", () => {
    expect(extractLinks("", "https://x.test/", ".*")).toEqual([]);
    expect(extractLinks("<p>no links</p>", "https://x.test/", ".*")).toEqual([]);
  });
});

describe("rows", () => {
  it("builds a draft document row with a stable id", () => {
    const row = draftDocumentRow({ url: "https://a.test/x.pdf", text: "" }, { id: "katuli-notices", issuer: "union", url: "https://a.test/", linkPattern: "" }, "2026-09-26");
    expect(row.id).toMatch(/^katuli-notices-[0-9a-f]{8}$/);
    expect(row.status).toBe("draft");
    expect(row.title_bn).toBe("x.pdf");
    expect(row.date).toBe("2026-09-26");
  });
  it("appends CSV rows with proper quoting and a trailing newline", () => {
    const csv = "id,title_bn\nold,পুরনো";
    const next = appendRows(csv, [{ id: "new", title_bn: "কমা, সহ" }], ["id", "title_bn"]);
    expect(next).toBe('id,title_bn\nold,পুরনো\nnew,"কমা, সহ"\n');
    expect(knownUrls("id,url\na,https://x.test/1\nb,\n")).toEqual(new Set(["https://x.test/1"]));
  });
  it("detects downloadable files", () => {
    expect(isFileUrl("https://a.test/x.PDF")).toBe(true);
    expect(isFileUrl("https://a.test/x.jpg?v=2")).toBe(true);
    expect(isFileUrl("https://a.test/pages/notices/1")).toBe(false);
  });
});
