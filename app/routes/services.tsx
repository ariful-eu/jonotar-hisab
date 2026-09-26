import { Link, useLoaderData } from "react-router";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("ইউনিয়ন পরিষদের সেবার সরকারি ফি", "জন্ম নিবন্ধন, সনদ, ট্রেড লাইসেন্স — সরকারি ফি কত আর কত দিনে পাওয়ার কথা। বেশি চাইলে কোথায় অভিযোগ করবেন।");
}

export async function loader() {
  const ds = loadDataset();
  return { fees: ds.fees, docs: docRefs(ds.documents, ds.fees.map((x) => x.source_doc)) };
}

export default function Services() {
  const { fees, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  return (
    <>
      <h1>{t("সেবার সরকারি ফি", "Official service fees")}</h1>
      <p>{t("নিচের ফি-র বেশি টাকা চাওয়া হলে রসিদ চান, আর অভিযোগ করুন।", "If you are asked for more than these fees, ask for a receipt and complain.")}</p>
      {fees.length === 0 ? <p className="muted">{t("এখনো কোনো ফি-র তথ্য যোগ করা হয়নি।", "No fee information has been added yet.")}</p> : null}
      {fees.map((x) => (
        <section key={x.id} className="card">
          <h2 className="h3">{f.lang === "bn" ? x.service_bn : x.service_en}</h2>
          <dl className="kv">
            <dt>{t("সরকারি ফি", "Official fee")}</dt>
            <dd>{x.official_fee === null ? <Unknown rti="citizen-charter" /> : x.official_fee === 0 ? t("বিনামূল্যে", "Free") : f.takaFull(x.official_fee)}</dd>
            <dt>{t("কত দিনে", "Time limit")}</dt>
            <dd>{x.time_limit_days === null ? <Unknown rti="citizen-charter" /> : t(`${f.digits(x.time_limit_days)} দিন`, `${x.time_limit_days} days`)}</dd>
            <dt>{t("আইনি ভিত্তি", "Legal basis")}</dt><dd>{x.legal_basis}</dd>
          </dl>
          {x.note_bn ? <p className="muted">{x.note_bn}</p> : null}
          <SourceBadge type="upstream" doc={docs[x.source_doc]} />
        </section>
      ))}
      <section className="card">
        <h2 className="h3">{t("বেশি টাকা চাইলে কী করবেন", "Asked to pay more?")}</h2>
        <p>{t("দুদক হটলাইন ১০৬ (টোল-ফ্রি), অনলাইনে GRS, অথবা উপজেলা নির্বাহী অফিসারের কাছে লিখিত অভিযোগ।", "ACC hotline 106 (toll-free), GRS online, or a written complaint to the Upazila Nirbahi Officer.")}</p>
        <Link to="/rights/complain">{t("অভিযোগের সব পথ →", "All complaint channels →")}</Link>
      </section>
    </>
  );
}
