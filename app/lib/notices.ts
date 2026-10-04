import type { DocumentRow, TenderRow } from "../data/schemas";

export type NoticeItem = { id: string; title_bn: string; title_en: string | null; date: string | null; issuer: string; kind: "document" | "tender"; url: string; external: boolean };

const LOCAL_ISSUERS = new Set(["union", "upazila", "district"]);

export function noticesFeed(docs: DocumentRow[], tenders: TenderRow[], excludeIdPrefixes: string[] = []): NoticeItem[] {
  const items: NoticeItem[] = [
    ...docs
      .filter((d) => d.status === "published" && LOCAL_ISSUERS.has(d.issuer) && !excludeIdPrefixes.some((p) => d.id.startsWith(p)))
      .map((d) => ({ id: d.id, title_bn: d.title_bn, title_en: d.title_en, date: d.date, issuer: d.issuer, kind: "document" as const, url: d.archive_path ?? d.url ?? "", external: true })),
    ...tenders.filter((t) => t.status === "published").map((t) => ({ id: t.id, title_bn: t.title_bn, title_en: t.title_en, date: t.published, issuer: t.issuer, kind: "tender" as const, url: `/tenders/${t.id}`, external: false })),
  ];
  return items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
