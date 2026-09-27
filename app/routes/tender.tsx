import { data, Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { Amount } from "../components/Amount";
import { DeadlineBadge } from "../components/DeadlineBadge";
import { ShareButtons } from "../components/ShareButtons";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export const meta: MetaFunction<typeof loader> = ({ data }) =>
  pageMeta(data?.tender.title_bn ?? "দরপত্র", "কাতুলী ইউনিয়নের দরপত্র বিজ্ঞপ্তি — শেষ তারিখ, মূল্য, মূল নোটিশ।");

export async function loader({ params }: LoaderFunctionArgs) {
  const ds = loadDataset();
  const tender = ds.tenders.find((x) => x.id === params.id);
  if (!tender) throw data(null, { status: 404 });
  const project = tender.project_id ? ds.projects.find((p) => p.id === tender.project_id) ?? null : null;
  return { tender, project: project ? { id: project.id, name_bn: project.name_bn } : null };
}

export default function Tender() {
  const { tender: x, project } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const base = import.meta.env.BASE_URL;
  return (
    <>
      <p className="no-print"><Link to="/tenders">← {t("সব টেন্ডার", "All tenders")}</Link></p>
      <h1>{x.title_bn}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("আহ্বানকারী", "Issued by")}</dt><dd>{x.issuer}</dd>
          <dt>{t("স্মারক নং", "Reference")}</dt><dd>{x.ref_no ?? <Unknown />}</dd>
          <dt>{t("প্রকাশ", "Published")}</dt><dd>{x.published ? f.date(x.published) : <Unknown />}</dd>
          <dt>{t("শেষ তারিখ", "Deadline")}</dt><dd><DeadlineBadge deadline={x.deadline} /></dd>
          <dt>{t("আনুমানিক মূল্য", "Estimated value")}</dt><dd><Amount value={x.est_value} full /></dd>
          <dt>{t("কাজ পেয়েছে", "Awarded to")}</dt><dd>{x.awarded_to ?? <Unknown />}</dd>
          <dt>{t("চুক্তিমূল্য", "Contract value")}</dt><dd><Amount value={x.award_value} full /></dd>
        </dl>
        <div className="share">
          {x.archive_path ? <a className="btn" href={`${base}${x.archive_path}`} target="_blank" rel="noopener">{t("সংরক্ষিত নোটিশ", "Saved copy of notice")}</a> : null}
          {x.url ? <a className="btn" href={x.url} target="_blank" rel="noopener">{t("মূল ওয়েবসাইটে", "On the original website")}</a> : null}
        </div>
        {project ? <p>{t("এই টেন্ডারের কাজ: ", "The work: ")}<Link to={`/projects/${project.id}`}>{project.name_bn}</Link></p> : null}
      </section>
      <ShareButtons title={x.title_bn} />
    </>
  );
}
