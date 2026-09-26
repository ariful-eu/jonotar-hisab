import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/rights-topic";
import { RtiForm } from "../components/RtiForm";
import { ShareButtons } from "../components/ShareButtons";
import { RIGHTS_TOPICS } from "../content/rights";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { docHref } from "../components/SourceBadge";
import { useLang, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  return pageMeta(data?.topic.title_bn ?? "আপনার অধিকার", data?.topic.summary_bn ?? "");
}

export async function loader({ params }: Route.LoaderArgs) {
  const topic = RIGHTS_TOPICS.find((x) => x.key === params.topic);
  if (!topic) throw data(null, { status: 404 });
  const ds = loadDataset();
  return {
    topic,
    docs: Object.values(docRefs(ds.documents, topic.source_docs)),
    rtiItems: topic.key === "rti" ? ds.disclosures.filter((d) => d.published !== "yes").map(({ id, requirement_bn, rti_request_bn }) => ({ id, requirement_bn, rti_request_bn })) : [],
    union: { name_bn: ds.union.name_bn, upazila_bn: ds.union.upazila_bn, district_bn: ds.union.district_bn },
  };
}

export default function RightsTopic() {
  const { topic, docs, rtiItems, union } = useLoaderData<typeof loader>();
  const t = useT();
  const { lang } = useLang();
  return (
    <>
      <p className="no-print"><Link to="/rights">← {t("সব অধিকার", "All rights")}</Link></p>
      <h1 className="no-print">{lang === "bn" ? topic.title_bn : topic.title_en}</h1>
      <p className="no-print">{lang === "bn" ? topic.summary_bn : topic.summary_en}</p>
      {topic.key === "rti" ? <RtiForm items={rtiItems} union={union} /> : null}
      <div className="no-print">
        {topic.sections.map((s) => (
          <section key={s.heading_en} className="card">
            <h2 className="h3">{lang === "bn" ? s.heading_bn : s.heading_en}</h2>
            <ol>{s.points.map((p) => <li key={p.en}>{lang === "bn" ? p.bn : p.en}</li>)}</ol>
          </section>
        ))}
        {topic.links.length > 0 ? <div className="share">{topic.links.map((l) => <a key={l.href} className="btn" href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener">{lang === "bn" ? l.label_bn : l.label_en}</a>)}</div> : null}
        {docs.length > 0 ? (
          <p className="muted">{t("উৎস: ", "Sources: ")}{docs.map((d, i) => { const href = docHref(d); return <span key={d.id}>{i > 0 ? " · " : ""}{href ? <a href={href} target="_blank" rel="noopener">{lang === "en" && d.title_en ? d.title_en : d.title_bn}</a> : d.title_bn}</span>; })}</p>
        ) : null}
        <ShareButtons title={topic.title_bn} />
      </div>
    </>
  );
}
