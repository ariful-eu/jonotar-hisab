import { Link, useLoaderData } from "react-router";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("সামাজিক নিরাপত্তা ভাতা — কে পাবেন, কত টাকা", "বয়স্ক, বিধবা, প্রতিবন্ধী ভাতা ও অন্যান্য কর্মসূচি: যোগ্যতা, মাসিক পরিমাণ, কীভাবে বাছাই হয়, ওয়ার্ডওয়ারি সংখ্যা।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    allowances: ds.allowances,
    counts: ds.allowanceCounts,
    wards: ds.union.wards.map((w) => w.no),
    docs: docRefs(ds.documents, [...ds.allowances.map((a) => a.source_doc), ...ds.allowanceCounts.map((c) => c.source_doc)]),
  };
}

export default function Allowances() {
  const { allowances, counts, wards, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const countRow = (programme: string, ward: number | null) => counts.find((c) => c.programme === programme && c.ward === ward) ?? null;
  const cell = (programme: string, ward: number | null) => {
    const c = countRow(programme, ward);
    return c?.beneficiary_count == null ? <Unknown rti="beneficiary-counts" /> : <>{f.num(c.beneficiary_count)} <span className="muted">({f.fy(c.fiscal_year)})</span></>;
  };
  return (
    <>
      <h1>{t("ভাতা ও সহায়তা: কে পাবেন, কত টাকা", "Allowances: who qualifies, how much")}</h1>
      <p>{t("উপকারভোগীদের তালিকা ওয়ার্ড সভায় ঠিক হওয়ার কথা। আমরা কারো নাম প্রকাশ করি না — শুধু সংখ্যা।", "Beneficiary lists are meant to be decided at the ward shava. We never publish names — only counts.")}</p>
      {allowances.map((a) => {
        const unionCount = countRow(a.programme, null);
        return (
          <section key={a.programme} className="card">
            <h2 className="h3">{f.lang === "bn" ? a.name_bn : a.name_en}</h2>
            <p className="hero-number" style={{ fontSize: "1.8rem" }}>
              {a.monthly_amount !== null ? t(`${f.takaFull(a.monthly_amount)} / মাস`, `${f.takaFull(a.monthly_amount)} / month`) : a.payment_note_bn ?? <Unknown />}
            </p>
            <p className="muted">{t(`${f.fy(a.fiscal_year)} অর্থবছরের হার`, `FY ${a.fiscal_year} rate`)}</p>
            <h3>{t("কারা পাবেন", "Who qualifies")}</h3>
            <p>{f.lang === "bn" ? a.eligibility_bn : a.eligibility_en}</p>
            <h3>{t("কীভাবে বাছাই হয়", "How people are selected")}</h3>
            <p>{f.lang === "bn" ? a.selection_bn : a.selection_en}</p>
            <h3>{t("কাতুলী ইউনিয়নে কতজন পান", "How many receive it in Katuli Union")}</h3>
            <p>{cell(a.programme, null)} {unionCount ? <SourceBadge type={unionCount.source_type} doc={docs[unionCount.source_doc]} /> : null}</p>
            {wards.some((w) => countRow(a.programme, w)) ? (
              <details>
                <summary>{t("ওয়ার্ডওয়ারি সংখ্যা", "Per ward")}</summary>
                <table className="lines">
                  <tbody>
                    {wards.map((w) => <tr key={w}><td>{t(`ওয়ার্ড ${f.digits(w)}`, `Ward ${w}`)}</td><td className="num">{cell(a.programme, w)}</td></tr>)}
                  </tbody>
                </table>
              </details>
            ) : (
              <p className="muted">{t("ওয়ার্ডওয়ারি সংখ্যা প্রকাশিত হয়নি। ", "Per-ward counts not published. ")}<Link to="/rights/rti?item=beneficiary-counts">{t("তথ্য চান →", "Ask for it →")}</Link></p>
            )}
            <p><SourceBadge type="upstream" doc={docs[a.source_doc]} /></p>
          </section>
        );
      })}
    </>
  );
}
