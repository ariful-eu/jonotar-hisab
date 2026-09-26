import { Link, useLoaderData } from "react-router";
import { Amount } from "../components/Amount";
import { DeadlineBadge } from "../components/DeadlineBadge";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("দরপত্র বিজ্ঞপ্তি — কাতুলী ইউনিয়ন", "কাতুলী ইউনিয়নের কাজের দরপত্র: শেষ তারিখ, আনুমানিক মূল্য, কে কাজ পেল।");
}

export async function loader() {
  const ds = loadDataset();
  return { tenders: [...ds.tenders].sort((a, b) => (b.deadline ?? b.published ?? "").localeCompare(a.deadline ?? a.published ?? "")) };
}

export default function Tenders() {
  const { tenders } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <h1>{t("দরপত্র (টেন্ডার)", "Tenders")}</h1>
      <p>{t("ইউনিয়নে কোন কাজের দরপত্র আহ্বান করা হয়েছে, কে কাজ পেয়েছে। সরকারি কেনাকাটায় দরপত্রের তথ্য প্রকাশ্য হওয়ার কথা।", "Which works were put out to tender in the union, and who won them. Public procurement notices are meant to be public.")}</p>
      {tenders.length === 0 ? (
        <div className="card">
          <p>{t("কাতুলী ইউনিয়নের কোনো দরপত্র বিজ্ঞপ্তি এখনো অনলাইনে পাওয়া যায়নি। আমাদের স্বয়ংক্রিয় ব্যবস্থা প্রতিদিন ইউনিয়ন ও উপজেলার ওয়েবসাইট দেখে।", "No tender notice for Katuli Union has been found online yet. Our automatic checker looks at the union and upazila websites every day.")}</p>
          <Link to="/rights/rti?item=tender-notices">{t("দরপত্রের তথ্য চেয়ে আবেদন করুন →", "Request tender information →")}</Link>
        </div>
      ) : tenders.map((x) => (
        <Link key={x.id} to={`/tenders/${x.id}`} className="card list-link">
          <h3>{x.title_bn}</h3>
          <div className="chips"><DeadlineBadge deadline={x.deadline} /><span className="chip">{x.issuer}</span></div>
          {x.est_value !== null ? <p>{t("আনুমানিক মূল্য: ", "Estimated value: ")}<Amount value={x.est_value} full /></p> : null}
        </Link>
      ))}
    </>
  );
}
