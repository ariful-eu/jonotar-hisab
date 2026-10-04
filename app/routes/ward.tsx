import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { data, Link, useLoaderData } from "react-router";
import { getMyWard, setMyWard } from "../lib/prefs";
import type { Route } from "./+types/ward";
import { Amount } from "../components/Amount";
import { ShareButtons } from "../components/ShareButtons";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { toBnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ params }: Route.MetaArgs) {
  return pageMeta(`কাতুলী ইউনিয়ন — ${toBnDigits(params.no ?? "")} নং ওয়ার্ড`, "এই ওয়ার্ডের প্রকল্প, ভাতাভোগীর সংখ্যা ও ওয়ার্ড সভায় আপনার অধিকার।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const ward = ds.union.wards.find((w) => String(w.no) === params.no);
  if (!ward) throw data(null, { status: 404 });
  return {
    ward,
    projects: ds.projects.filter((p) => p.ward === ward.no),
    allowances: ds.allowances.map((a) => ({
      programme: a.programme, name_bn: a.name_bn, name_en: a.name_en,
      count: ds.allowanceCounts.find((c) => c.programme === a.programme && c.ward === ward.no)?.beneficiary_count ?? null,
    })),
  };
}

function MyWardButton({ ward }: { ward: number }) {
  const t = useT();
  const [mine, setMine] = useState(false);
  useEffect(() => setMine(getMyWard() === ward), [ward]);
  return (
    <button
      type="button"
      className={`btn${mine ? " btn-primary" : ""} no-print`}
      aria-pressed={mine}
      onClick={() => {
        setMyWard(mine ? null : ward);
        setMine(!mine);
      }}
    >
      <MapPin size={18} aria-hidden />
      {mine ? t("এটা আমার ওয়ার্ড ✓ (হোমে দেখাবে)", "My ward ✓ (shown on home)") : t("এটা আমার ওয়ার্ড — মনে রাখুন", "This is my ward — remember it")}
    </button>
  );
}

export default function Ward() {
  const { ward, projects, allowances } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const villages = f.lang === "en" && ward.villages_en.length ? ward.villages_en : ward.villages_bn;
  return (
    <>
      <p className="no-print"><Link to="/wards">← {t("সব ওয়ার্ড", "All wards")}</Link></p>
      <h1>{t(`${f.digits(ward.no)} নং ওয়ার্ড`, `Ward ${ward.no}`)}</h1>
      <MyWardButton ward={ward.no} />
      <section className="card">
        <dl className="kv">
          <dt>{t("গ্রাম", "Villages")}</dt><dd>{villages.length ? villages.join(", ") : <Unknown />}</dd>
          <dt>{t("ওয়ার্ড সদস্য", "Ward member")}</dt>
          <dd>{ward.member_bn ?? <Unknown />}{ward.member_bn && !ward.member_verified_on ? <span className="muted"> ({t("যাচাই হয়নি", "unverified")})</span> : null}</dd>
        </dl>
      </section>

      <h2>{t("এই ওয়ার্ডের উন্নয়ন কাজ", "Works in this ward")}</h2>
      {projects.length === 0 ? <p className="muted">{t("এই ওয়ার্ডের কোনো কাজের তথ্য প্রকাশিত হয়নি। ", "No works published for this ward. ")}<Link to="/rights/rti?item=project-list">{t("কাজের তালিকা চান →", "Ask for the list →")}</Link></p> : (
        <table className="lines">
          <tbody>{projects.map((p) => (
            <tr key={p.id}>
              <td><Link to={`/projects/${p.id}`}>{p.name_bn}</Link><br /><span className="muted">{SCHEME_LABEL[p.scheme][f.lang]} · {PROJECT_STATUS_LABEL[p.status][f.lang]}</span></td>
              <td className="num"><Amount value={p.amount} full /></td>
            </tr>
          ))}</tbody>
        </table>
      )}

      <h2>{t("এই ওয়ার্ডে কতজন ভাতা পান", "Allowance recipients in this ward")}</h2>
      {allowances.every((a) => a.count === null) ? (
        <p className="muted">{t("ওয়ার্ডভিত্তিক ভাতাভোগীর সংখ্যা ইউনিয়ন প্রকাশ করেনি। ", "The union has not published ward-level counts. ")}<Link to="/rights/rti?item=beneficiary-counts">{t("তথ্য চান →", "Ask for it →")}</Link> · <Link to="/allowances">{t("কে ভাতা পাবেন দেখুন", "Who qualifies")}</Link></p>
      ) : (
        <table className="lines">
          <tbody>{allowances.map((a) => (
            <tr key={a.programme}><td>{f.lang === "bn" ? a.name_bn : a.name_en}</td><td className="num">{a.count === null ? <Unknown /> : f.num(a.count)}</td></tr>
          ))}</tbody>
        </table>
      )}

      <section className="card">
        <h2 className="h3">{t("ওয়ার্ড সভায় আপনার অধিকার", "Your rights at the ward meeting")}</h2>
        <p>{t("এই ওয়ার্ডের সব ভোটার ওয়ার্ড সভার সদস্য। বছরে অন্তত ২ বার সভা হওয়ার কথা, ৭ দিন আগে নোটিশ দিয়ে। এখানেই প্রকল্পের অগ্রাধিকার আর ভাতাভোগীর তালিকা ঠিক হয়।", "Every voter in this ward is a member of the ward shava. It must meet at least twice a year with 7 days' notice. Project priorities and beneficiary lists are decided here.")}</p>
        <Link to="/rights/ward-shava">{t("বিস্তারিত জানুন →", "Learn more →")}</Link>
      </section>

      <ShareButtons title={t(`কাতুলী ${f.digits(ward.no)} নং ওয়ার্ড`, `Katuli ward ${ward.no}`)} poster={`/poster/ward/${ward.no}`} />
    </>
  );
}
