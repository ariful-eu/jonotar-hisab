import { data, Link, useLoaderData } from "react-router";
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

export default function Ward() {
  const { ward, projects, allowances } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const villages = f.lang === "en" && ward.villages_en.length ? ward.villages_en : ward.villages_bn;
  return (
    <>
      <p className="no-print"><Link to="/wards">← {t("সব ওয়ার্ড", "All wards")}</Link></p>
      <h1>{t(`${f.digits(ward.no)} নং ওয়ার্ড`, `Ward ${ward.no}`)}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("গ্রাম", "Villages")}</dt><dd>{villages.length ? villages.join(", ") : <Unknown />}</dd>
          <dt>{t("ওয়ার্ড সদস্য", "Ward member")}</dt>
          <dd>{ward.member_bn ?? <Unknown />}{ward.member_bn && !ward.member_verified_on ? <span className="muted"> ({t("যাচাই হয়নি", "unverified")})</span> : null}</dd>
        </dl>
      </section>

      <h2>{t("এই ওয়ার্ডের প্রকল্প", "Projects in this ward")}</h2>
      {projects.length === 0 ? <p className="muted">{t("কোনো প্রকল্পের তথ্য পাওয়া যায়নি।", "No project information found.")} <Link to="/rights/rti?item=project-list">{t("প্রকল্প তালিকা চেয়ে নিন →", "Request the project list →")}</Link></p> : (
        <table className="lines">
          <tbody>{projects.map((p) => (
            <tr key={p.id}>
              <td><Link to={`/projects/${p.id}`}>{p.name_bn}</Link><br /><span className="muted">{SCHEME_LABEL[p.scheme][f.lang]} · {PROJECT_STATUS_LABEL[p.status][f.lang]}</span></td>
              <td className="num"><Amount value={p.amount} full /></td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {allowances.length > 0 ? (
        <>
          <h2>{t("এই ওয়ার্ডে ভাতাভোগী (সংখ্যা)", "Allowance recipients in this ward (counts)")}</h2>
          <table className="lines">
            <tbody>{allowances.map((a) => (
              <tr key={a.programme}><td>{f.lang === "bn" ? a.name_bn : a.name_en}</td><td className="num">{a.count === null ? <Unknown rti="beneficiary-counts" /> : f.num(a.count)}</td></tr>
            ))}</tbody>
          </table>
        </>
      ) : null}

      <section className="card">
        <h2 className="h3">{t("ওয়ার্ড সভায় আপনার অধিকার", "Your rights at the ward meeting")}</h2>
        <p>{t("এই ওয়ার্ডের সব ভোটার ওয়ার্ড সভার সদস্য। বছরে অন্তত ২ বার সভা হওয়ার কথা, ৭ দিন আগে নোটিশ দিয়ে। এখানেই প্রকল্পের অগ্রাধিকার আর ভাতাভোগীর তালিকা ঠিক হয়।", "Every voter in this ward is a member of the ward shava. It must meet at least twice a year with 7 days' notice. Project priorities and beneficiary lists are decided here.")}</p>
        <Link to="/rights/ward-shava">{t("বিস্তারিত জানুন →", "Learn more →")}</Link>
      </section>

      <ShareButtons title={t(`কাতুলী ${f.digits(ward.no)} নং ওয়ার্ড`, `Katuli ward ${ward.no}`)} />
      <p className="no-print"><Link to={`/poster/ward/${ward.no}`}>{t("ওয়ার্ড-পোস্টার প্রিন্ট করুন", "Print a ward poster")}</Link></p>
    </>
  );
}
