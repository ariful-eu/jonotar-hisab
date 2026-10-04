import { MessageCircle } from "lucide-react";
import { data, Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { Amount } from "../components/Amount";
import { ShareButtons } from "../components/ShareButtons";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { OBSERVED_LABEL, PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return pageMeta("প্রকল্প", "");
  return pageMeta(data.project.name_bn, "কাতুলী ইউনিয়নের প্রকল্প — বরাদ্দ, বাস্তবায়নকারী, সরেজমিন পর্যবেক্ষণ। আপনি কী দেখেছেন জানান।");
};

export async function loader({ params }: LoaderFunctionArgs) {
  const ds = loadDataset();
  const project = ds.projects.find((p) => p.id === params.id);
  if (!project) throw data(null, { status: 404 });
  return {
    project,
    visits: ds.verifications.filter((v) => v.project_id === project.id).sort((a, b) => b.visit_date.localeCompare(a.visit_date)),
    tenders: ds.tenders.filter((t) => t.project_id === project.id).map((t) => ({ id: t.id, title_bn: t.title_bn })),
    docs: docRefs(ds.documents, [project.source_doc]),
    whatsapp: ds.union.maintainer.whatsapp,
  };
}

export default function Project() {
  const { project: p, visits, tenders, docs, whatsapp } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const name = f.lang === "en" && p.name_en ? p.name_en : p.name_bn;
  const reportText = `প্রকল্প: ${p.name_bn} (${p.id})\nআমি যা দেখেছি (তারিখ ও স্থানসহ): `;
  const base = import.meta.env.BASE_URL;

  return (
    <>
      <p className="no-print"><Link to="/projects">← {t("সব কাজ", "All works")}</Link></p>
      <h1>{name}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("বরাদ্দ টাকা", "Allocated")}</dt><dd><Amount value={p.amount} full /></dd>
          <dt>{t("কোন খাতের টাকা", "Funding source")}</dt><dd>{SCHEME_LABEL[p.scheme][f.lang]}</dd>
          <dt>{t("অর্থবছর", "Fiscal year")}</dt><dd>{p.fiscal_year ? f.fy(p.fiscal_year) : <Unknown />}</dd>
          <dt>{t("ওয়ার্ড / গ্রাম", "Ward / village")}</dt><dd>{p.ward ? f.digits(p.ward) : <Unknown />}{p.village_bn ? ` · ${p.village_bn}` : ""}</dd>
          <dt>{t("কাজের মাপ", "Scope of work")}</dt><dd>{p.unit_of_work_bn ?? <Unknown />}</dd>
          <dt>{t("কে কাজ করছে (ঠিকাদার/প্রকল্প কমিটি)", "Who does it (contractor/committee)")}</dt><dd>{p.implementer_bn ?? <Unknown />}</dd>
          <dt>{t("শুরু – শেষ", "Start – end")}</dt><dd>{p.start ? f.date(p.start) : "?"} – {p.end ? f.date(p.end) : "?"}</dd>
          <dt>{t("কাগজে কাজের অবস্থা", "Status on paper")}</dt><dd>{PROJECT_STATUS_LABEL[p.status][f.lang]}</dd>
          <dt>{t("উৎস", "Source")}</dt><dd><SourceBadge type={p.source_type} doc={docs[p.source_doc]} /></dd>
        </dl>
        {tenders.length > 0 ? <p>{t("এই কাজের টেন্ডার: ", "Tender for this work: ")}{tenders.map((x) => <Link key={x.id} to={`/tenders/${x.id}`}>{x.title_bn}</Link>)}</p> : null}
      </section>

      <h2>{t("স্বেচ্ছাসেবকেরা গিয়ে যা দেখেছেন", "What volunteers saw on site")}</h2>
      {visits.length === 0 ? (
        <p className="muted">{t("এখনো কোনো স্বেচ্ছাসেবক এই প্রকল্প দেখে আসেননি। আপনি দেখে এলে জানান।", "No volunteer has visited yet. If you go, tell us what you see.")}</p>
      ) : (
        <ol className="timeline">
          {visits.map((v, i) => (
            <li key={i}>
              <strong>{f.date(v.visit_date)}</strong> · <span className="chip chip-observed">{OBSERVED_LABEL[v.observed_status][f.lang]}</span>
              <p>{v.observation_bn}</p>
              {v.measured ? <p className="muted">{t("মাপ: ", "Measured: ")}{v.measured}</p> : null}
              {v.photo_paths.length > 0 ? (
                <div className="photos">{v.photo_paths.map((src) => <img key={src} src={`${base}${src}`} alt={t(`${f.date(v.visit_date)} তারিখের ছবি`, `Photo from ${v.visit_date}`)} loading="lazy" />)}</div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <h2>{t("ইউনিয়ন পরিষদের বক্তব্য", "Union Parishad's response")}</h2>
      <p>{p.up_reply_bn ?? t("এখনো কোনো বক্তব্য পাওয়া যায়নি। ইউনিয়ন পরিষদ চাইলে তাদের বক্তব্য এখানে যোগ করা হবে।", "No response yet. If the Union Parishad sends one, it will be added here.")}</p>

      <section className="card no-print">
        <h2 className="h3">{t("এই কাজ সম্পর্কে জানেন?", "Know something about this work?")}</h2>
        <p>{t("কাজটি শুরু হয়েছে বা শেষ হয়েছে দেখলে, অথবা ছবি থাকলে আমাদের জানান — এলাকার সবাই হালনাগাদ তথ্য পাবেন। ছবির সাথে তারিখ ও জায়গা লিখে দিন।", "Seen this work start or finish, or have a photo? Tell us so everyone gets up-to-date information. Include the date and place.")}</p>
        <div className="share">
          {whatsapp ? <a className="btn btn-primary" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(reportText)}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden />{t("হোয়াটসঅ্যাপে জানান", "Send on WhatsApp")}</a> : null}
          <Link className="btn" to="/rights/complain">{t("কোনো সমস্যা? কোথায় যাবেন", "A problem? Where to go")}</Link>
        </div>
      </section>

      <ShareButtons title={name} poster={`/poster/project/${p.id}`} />
    </>
  );
}
