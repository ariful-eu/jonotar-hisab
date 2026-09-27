import { describe, expect, it } from "vitest";
import { lgedRows, parseLgedNotice } from "../scripts/lib/lged";

const TEXT = `Local Government Engineering Department Office of the Executive Engineer District: Tangail Memo No. 46.02.9300.000.01.015.26-3895 Date: 28-07-2026 e-Tender Notice No.04/2026-2027 e-Tender is invited ... Remarks (LTM) 1. 1306709 Improvement of Upoldia Jame Mosque Under Degolkandi Union, Upazila: Ghatail, District:Tangail. [Latitude:24.26854, Longitude: 89.856245] GSID-2/TNG/SDW-806 09-08-2026 & 16.00pm 10-08-2026 & 15.00pm LTM 2. 1306710 Improvement of Char Chowbaria Graveyard Under Katuli Union, Upazila: Tangail Sadar, District:Tangail. [Latitude:24.2217, Longitude: 89.84289] GSID-2/TNG/SDW-807 09-08-2026 & 16.00pm 10-08-2026 & 15.00pm LTM 3. 1306711 Improvement of Gopalpur Baitul Aman Jame Mosque Under Baghil Union, Upazila: Tangail Sadar, District:Tangail. [Latitude:24.271695, Longitude: 89.856644] GSID-2/TNG/SDW-808 09-08-2026 & 16.00pm 10-08-2026 & 15.00pm LTM`;

describe("parseLgedNotice", () => {
  it("reads notice metadata and every package row", () => {
    const n = parseLgedNotice(TEXT);
    expect(n.noticeNo).toBe("04/2026-2027");
    expect(n.date).toBe("2026-07-28");
    expect(n.rows).toHaveLength(3);
    expect(n.rows[1]).toEqual({ tenderId: "1306710", scheme: "Improvement of Char Chowbaria Graveyard", union: "Katuli", upazila: "Tangail Sadar", lat: 24.2217, lng: 89.84289, packageNo: "GSID-2/TNG/SDW-807", closing: "2026-08-10" });
  });
  it("keeps only rows in the target union and upazila", () => {
    const rows = lgedRows(TEXT, { union: "Katuli", upazila: "Tangail Sadar" });
    expect(rows.map((r) => r.tenderId)).toEqual(["1306710"]);
  });
  it("is not thrown off by a preceding row that has no Union", () => {
    const t = "Remarks (LTM) 2. 1128600 Construction of Dhopakhali Union Land Office Boundary Wall (Remaining Part) Under Upazila : Dhanbari, District: Tangail TAN/TULO-2/BWD-03/ 09 22-07-2025 & 16.00pm 23-07-2025 & 15.00pm LTM 3. 1128639 Improvement of Bagbari Chowbaria Jame Mosque Under Katuli Union, Upazila: Tangail Sadar, District:Tangail. [Latitude:24.231614, Longitude: 89.834115] GSID-2/TNG/SDW-648 22-07-2025 & 16.00pm 23-07-2025 & 15.00pm LTM";
    expect(lgedRows(t, { union: "Katuli", upazila: "Tangail Sadar" })).toEqual([{ tenderId: "1128639", scheme: "Improvement of Bagbari Chowbaria Jame Mosque", union: "Katuli", upazila: "Tangail Sadar", lat: 24.231614, lng: 89.834115, packageNo: "GSID-2/TNG/SDW-648", closing: "2025-07-23" }]);
  });
  it("returns nothing for unrelated or empty text", () => {
    expect(parseLgedNotice("").rows).toEqual([]);
    expect(lgedRows(TEXT.replace(/Katuli/g, "Kakua"), { union: "Katuli", upazila: "Tangail Sadar" })).toEqual([]);
  });
});

import { lgedRecords } from "../scripts/lib/lged";

describe("lgedRecords", () => {
  it("builds one published document plus a tender and project per matching package", () => {
    const r = lgedRecords(TEXT, { union: "Katuli", upazila: "Tangail Sadar" }, "https://x.test/n.pdf", "archive/lged/lged-notice-04-2026-2027.pdf");
    expect(r.document).toMatchObject({ id: "lged-notice-04-2026-2027", status: "published", date: "2026-07-28", fiscal_year: "2026-27", archive_path: "archive/lged/lged-notice-04-2026-2027.pdf" });
    expect(r.tenders).toEqual([expect.objectContaining({ id: "lged-tender-1306710", ref_no: "e-GP ID 1306710 · GSID-2/TNG/SDW-807", deadline: "2026-08-10", published: "2026-07-28", project_id: "lged-1306710", status: "published" })]);
    expect(r.projects).toEqual([expect.objectContaining({ id: "lged-1306710", lat: "24.2217", lng: "89.84289", source_type: "upstream", source_doc: "lged-notice-04-2026-2027", status: "planned", status_row: "published" })]);
  });
  it("returns no document when no package matches", () => {
    expect(lgedRecords(TEXT.replace(/Katuli/g, "Kakua"), { union: "Katuli", upazila: "Tangail Sadar" }, "u", "a").document).toBeNull();
  });
});
