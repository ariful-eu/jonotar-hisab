import type { DocumentRow } from "./schemas";

export type DocRef = Pick<DocumentRow, "id" | "title_bn" | "title_en" | "url" | "archive_path" | "reliability" | "issuer" | "date">;

export function docRefs(docs: DocumentRow[], ids: Iterable<string>): Record<string, DocRef> {
  const want = new Set(ids);
  return Object.fromEntries(
    docs.filter((d) => want.has(d.id)).map((d) => [d.id, { id: d.id, title_bn: d.title_bn, title_en: d.title_en, url: d.url, archive_path: d.archive_path, reliability: d.reliability, issuer: d.issuer, date: d.date }]),
  );
}
