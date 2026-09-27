import type { DocRef } from "../data/refs";
import type { SourceType } from "../data/schemas";
import { useLang, useT } from "../lib/i18n";
import { SOURCE_TYPE_LABEL } from "../lib/labels";

export function docHref(doc: DocRef): string | null {
  return doc.archive_path ? `${import.meta.env.BASE_URL}${doc.archive_path}` : doc.url;
}

export function SourceBadge({ type, doc }: { type: SourceType; doc?: DocRef }) {
  const t = useT();
  const { lang } = useLang();
  const href = doc ? docHref(doc) : null;
  return (
    <span className="source">
      <span className={`chip chip-${type}`}>{SOURCE_TYPE_LABEL[type][lang]}</span>
      {doc?.reliability === "low" ? <span className="chip chip-low">{t("কম নির্ভরযোগ্য", "Low reliability")}</span> : null}
      {href ? <a href={href} target="_blank" rel="noopener" className="small-link">{t("কাগজ দেখুন", "See document")}</a> : null}
    </span>
  );
}
