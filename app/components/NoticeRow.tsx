import { ExternalLink, FileText, Gavel } from "lucide-react";
import { Link } from "react-router";
import { useFmt, useT } from "../lib/i18n";
import { ISSUER_LABEL } from "../lib/labels";
import type { NoticeItem } from "../lib/notices";

export function NoticeRow({ x }: { x: NoticeItem }) {
  const t = useT();
  const f = useFmt();
  const Icon = x.kind === "tender" ? Gavel : FileText;
  const label = (f.lang === "en" && x.title_en) || x.title_bn;
  const issuer = x.kind === "tender" ? t("টেন্ডার", "Tender") : ISSUER_LABEL[x.issuer as keyof typeof ISSUER_LABEL]?.[f.lang] ?? x.issuer;
  const meta = <span className="muted">{issuer}{x.date ? ` · ${f.date(x.date)}` : ""}</span>;
  const href = x.url.startsWith("http") ? x.url : `${import.meta.env.BASE_URL}${x.url}`;
  return (
    <li className="notice">
      <Icon size={20} aria-hidden className="notice-icon" />
      <span className="grow">
        {x.external ? (
          <a href={href} target="_blank" rel="noopener">{label} <ExternalLink size={14} aria-hidden /></a>
        ) : (
          <Link to={x.url}>{label}</Link>
        )}
        <br />
        {meta}
      </span>
    </li>
  );
}
