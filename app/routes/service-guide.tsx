import { Building2, ExternalLink, FileCheck, Globe, Lightbulb, ListOrdered, MapPin, Receipt, UserCheck } from "lucide-react";
import { data, Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { GuideIcon } from "../components/GuideIcon";
import { ShareButtons } from "../components/ShareButtons";
import { docHref } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { SERVICE_GUIDES } from "../content/service-guides";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export const meta: MetaFunction<typeof loader> = ({ data }) =>
  data ? pageMeta(`${data.guide.title_bn} — কীভাবে করবেন`, data.guide.summary_bn) : pageMeta("সেবা", "");

export async function loader({ params }: LoaderFunctionArgs) {
  const guide = SERVICE_GUIDES.find((g) => g.id === params.id);
  if (!guide) throw data(null, { status: 404 });
  const ds = loadDataset();
  return {
    guide,
    fees: guide.fee_ids.map((id) => ds.fees.find((x) => x.id === id)).filter((x) => x !== undefined),
    docs: Object.values(docRefs(ds.documents, guide.source_docs)),
  };
}

export default function ServiceGuidePage() {
  const { guide: g, fees, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const b = (x: { bn: string; en: string }) => (f.lang === "bn" ? x.bn : x.en);
  const WhereIcon = { up: Building2, udc: Building2, online: Globe, other: MapPin };

  return (
    <>
      <p className="no-print"><Link to="/services">← {t("সব সেবা", "All services")}</Link></p>
      <h1 className="guide-title"><span className="menu-icon"><GuideIcon icon={g.icon} size={26} /></span>{f.lang === "bn" ? g.title_bn : g.title_en}</h1>
      <p className="intro">{f.lang === "bn" ? g.summary_bn : g.summary_en}</p>

      <section className="card guide-section">
        <h2 className="h3"><UserCheck size={20} aria-hidden /> {t("কারা আবেদন করবেন", "Who applies")}</h2>
        <ul>{g.who.map((x) => <li key={x.en}>{b(x)}</li>)}</ul>
      </section>

      <section className="card guide-section">
        <h2 className="h3"><FileCheck size={20} aria-hidden /> {t("কী কী লাগবে", "What you need")}</h2>
        <ul className="checklist">{g.papers.map((x) => <li key={x.en}>{b(x)}</li>)}</ul>
      </section>

      <section className="card guide-section">
        <h2 className="h3"><Receipt size={20} aria-hidden /> {t("সরকারি ফি", "Official fee")}</h2>
        {fees.length > 0 ? (
          <table className="lines">
            <tbody>
              {fees.map((x) => (
                <tr key={x.id}><td>{f.lang === "bn" ? x.service_bn : x.service_en}</td><td className="num">{x.official_fee === null ? <Unknown rti="citizen-charter" /> : x.official_fee === 0 ? t("বিনামূল্যে", "Free") : f.takaFull(x.official_fee)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {g.fee_note ? <p>{b(g.fee_note)}</p> : null}
        <p className="muted">{t("সরকারি ফি দিয়ে অবশ্যই রসিদ নিন।", "Always take a receipt for the official fee.")}</p>
      </section>

      <section className="card guide-section">
        <h2 className="h3"><MapPin size={20} aria-hidden /> {t("কোথায় যাবেন", "Where to go")}</h2>
        <ul className="where-list">
          {g.where.map((w) => {
            const Icon = WhereIcon[w.kind];
            return (
              <li key={w.label_en}>
                <Icon size={18} aria-hidden />
                {w.url ? <a href={w.url} target="_blank" rel="noopener">{f.lang === "bn" ? w.label_bn : w.label_en} <ExternalLink size={14} aria-hidden /></a> : <span>{f.lang === "bn" ? w.label_bn : w.label_en}</span>}
              </li>
            );
          })}
        </ul>
        {g.time ? <p>{b(g.time)}</p> : null}
      </section>

      <section className="card guide-section">
        <h2 className="h3"><ListOrdered size={20} aria-hidden /> {t("ধাপে ধাপে", "Step by step")}</h2>
        <ol className="steps">{g.steps.map((x) => <li key={x.en}>{b(x)}</li>)}</ol>
      </section>

      {g.tips.length > 0 ? (
        <section className="card guide-section tips">
          <h2 className="h3"><Lightbulb size={20} aria-hidden /> {t("জেনে রাখুন", "Good to know")}</h2>
          <ul>{g.tips.map((x) => <li key={x.en}>{b(x)}</li>)}</ul>
        </section>
      ) : null}

      <p className="muted">
        {t("তথ্যের উৎস: ", "Sources: ")}
        {docs.map((d, i) => {
          const href = docHref(d);
          const label = f.lang === "en" && d.title_en ? d.title_en : d.title_bn;
          return <span key={d.id}>{i > 0 ? " · " : ""}{href ? <a href={href} target="_blank" rel="noopener">{label}</a> : label}</span>;
        })}
        {t(" — নিয়ম বদলাতে পারে; ভুল চোখে পড়লে জানান।", " — rules can change; tell us if something looks wrong.")}
      </p>
      <p><Link to="/rights/complain">{t("কাজ আটকে গেলে বা বেশি টাকা চাইলে কোথায় যাবেন →", "Stuck, or asked to pay more? Where to go →")}</Link></p>

      <ShareButtons title={t(`${g.title_bn} — কীভাবে করবেন`, `${g.title_en} — how to`)} />
    </>
  );
}
