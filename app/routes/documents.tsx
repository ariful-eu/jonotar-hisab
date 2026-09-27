import { useState } from "react";
import { useLoaderData } from "react-router";
import { DisclosureStrip } from "../components/DisclosureStrip";
import { docHref } from "../components/SourceBadge";
import { loadDataset } from "../data/load.server";
import { ISSUERS } from "../data/schemas";
import { useFmt, useT } from "../lib/i18n";
import { ISSUER_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("নথিপত্র ও প্রকাশের হিসাব", "আইন অনুযায়ী কোন নথি প্রকাশ হওয়ার কথা, কোনটি পাওয়া গেছে — আর আমাদের সংগ্রহে থাকা সব উৎস-নথি।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    disclosures: ds.disclosures.map(({ id, requirement_bn, requirement_en, published }) => ({ id, requirement_bn, requirement_en, published })),
    documents: [...ds.documents].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  };
}

export default function Documents() {
  const { disclosures, documents } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const [issuer, setIssuer] = useState("");
  const shown = documents.filter((d) => issuer === "" || d.issuer === issuer);
  return (
    <>
      <h1>{t("মূল কাগজপত্র", "Original documents")}</h1>
      <DisclosureStrip items={disclosures} full />
      <h2>{t("আমাদের কাছে থাকা সব কাগজ", "Documents we hold")}</h2>
      <p className="muted">{t("মূল ওয়েবসাইট থেকে সরিয়ে ফেলা হলেও যেন প্রমাণ থাকে, তাই প্রতিটি নথির কপি সংরক্ষণ করা হয়।", "We keep a copy of every document, so the evidence survives even if it is removed from the original website.")}</p>
      <div className="filters">
        <label>{t("কোন অফিসের", "Issued by")}
          <select value={issuer} onChange={(e) => setIssuer(e.target.value)}>
            <option value="">{t("সব", "All")}</option>
            {ISSUERS.map((i) => <option key={i} value={i}>{ISSUER_LABEL[i][f.lang]}</option>)}
          </select>
        </label>
      </div>
      {shown.map((d) => {
        const href = docHref(d);
        return (
          <div key={d.id} className="card">
            <h3>{href ? <a href={href} target="_blank" rel="noopener">{f.lang === "en" && d.title_en ? d.title_en : d.title_bn}</a> : d.title_bn}</h3>
            <div className="chips">
              <span className="chip">{ISSUER_LABEL[d.issuer][f.lang]}</span>
              {d.fiscal_year ? <span className="chip">{f.fy(d.fiscal_year)}</span> : null}
              {d.date ? <span className="chip">{f.date(d.date)}</span> : null}
              {d.reliability === "low" ? <span className="chip chip-low">{t("কম নির্ভরযোগ্য", "Low reliability")}</span> : null}
            </div>
            {d.note_bn ? <p className="muted">{d.note_bn}</p> : null}
            {d.url && d.archive_path ? <p className="small-link"><a href={d.url} target="_blank" rel="noopener">{t("মূল ওয়েবসাইটে দেখুন", "View on original website")}</a></p> : null}
          </div>
        );
      })}
    </>
  );
}
