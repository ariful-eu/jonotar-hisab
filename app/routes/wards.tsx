import { Link, useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("কাতুলী ইউনিয়নের ৯টি ওয়ার্ড", "আপনার ওয়ার্ডের প্রকল্প, ভাতা ও ওয়ার্ড সভার তথ্য।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    wards: ds.union.wards.map((w) => ({ ...w, projects: ds.projects.filter((p) => p.ward === w.no).length })),
    villages_bn: ds.union.villages_bn,
    villages_en: ds.union.villages_en,
  };
}

export default function Wards() {
  const { wards, villages_bn, villages_en } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const villages = f.lang === "en" && villages_en.length ? villages_en : villages_bn;
  return (
    <>
      <h1>{t("আমার ওয়ার্ড", "My ward")}</h1>
      <p>{t("আপনি কোন ওয়ার্ডে থাকেন? বেছে নিলে সেখানকার কাজ, ভাতা আর ওয়ার্ড সভার তথ্য দেখবেন।", "Which ward do you live in? Pick it to see works, allowances and ward meetings there.")}</p>
      <div className="tiles">
        {wards.map((w) => (
          <Link key={w.no} to={`/ward/${w.no}`} className="tile">
            <span className="ward-no">{t(`ওয়ার্ড ${f.digits(w.no)}`, `Ward ${w.no}`)}</span>
            <span className="muted">{w.projects > 0 ? t(`${f.digits(w.projects)}টি কাজের তথ্য`, `${w.projects} works listed`) : t("কাজের তথ্য নেই", "No works listed")}</span>
          </Link>
        ))}
      </div>
      {villages.length > 0 ? (
        <section className="card">
          <h2 className="h3">{t(`ইউনিয়নের ${f.digits(villages.length)}টি গ্রাম`, `The union's ${villages.length} villages`)}</h2>
          <p>{villages.join(", ")}</p>
          <p className="muted">{t("কোন গ্রাম কোন ওয়ার্ডে — পুরো তালিকা এখনো যাচাই হয়নি।", "Which village is in which ward has not been fully verified yet.")}</p>
        </section>
      ) : null}
    </>
  );
}
