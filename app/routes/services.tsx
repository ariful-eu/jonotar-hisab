import { ChevronRight, Globe, Info } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { GuideIcon } from "../components/GuideIcon";
import { Unknown } from "../components/Unknown";
import { SERVICE_GUIDES } from "../content/service-guides";
import { loadDataset } from "../data/load.server";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("সেবা পাবেন কীভাবে — জন্ম নিবন্ধন, সনদ, জমি, ভাতা", "কোন সেবার জন্য কী কাগজ লাগবে, সরকারি ফি কত, কোথায় যাবেন আর অনলাইনে কীভাবে করবেন — ধাপে ধাপে।");
}

export async function loader() {
  const ds = loadDataset();
  return { fees: ds.fees };
}

export default function Services() {
  const { fees } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const feeText = (id: string) => {
    const row = fees.find((x) => x.id === id);
    if (!row) return null;
    return row.official_fee === null ? null : row.official_fee === 0 ? t("বিনামূল্যে", "Free") : f.takaFull(row.official_fee);
  };
  return (
    <>
      <h1>{t("সেবা পাবেন কীভাবে", "How to get services")}</h1>
      <p className="intro">{t("ইউনিয়ন পরিষদ ও অন্যান্য সরকারি অফিসের সাধারণ সেবা — কী কাগজ লাগবে, সরকারি ফি কত, কোথায় যাবেন। অনেক কাজ এখন অনলাইনেও করা যায়।", "Common services from the Union Parishad and other offices — papers needed, official fees, where to go. Many can now be done online.")}</p>

      <div className="guide-list">
        {SERVICE_GUIDES.map((g) => {
          const firstFee = g.fee_ids.map(feeText).find((x) => x !== null);
          const online = g.where.some((w) => w.kind === "online");
          return (
            <Link key={g.id} to={`/services/${g.id}`} className="card list-link guide-card">
              <span className="menu-icon"><GuideIcon icon={g.icon} /></span>
              <span className="grow">
                <strong>{f.lang === "bn" ? g.title_bn : g.title_en}</strong>
                <span className="muted">{f.lang === "bn" ? g.summary_bn : g.summary_en}</span>
                <span className="chips">
                  {firstFee ? <span className="chip chip-union">{t(`ফি: ${firstFee} থেকে`, `Fee: from ${firstFee}`)}</span> : null}
                  {online ? <span className="chip"><Globe size={14} aria-hidden /> {t("অনলাইনেও", "Also online")}</span> : null}
                </span>
              </span>
              <ChevronRight size={20} aria-hidden className="menu-chevron" />
            </Link>
          );
        })}
      </div>

      <section aria-labelledby="fees-h">
        <h2 id="fees-h">{t("সব সরকারি ফি এক নজরে", "All official fees at a glance")}</h2>
        <table className="lines">
          <tbody>
            {fees.map((x) => (
              <tr key={x.id}>
                <td>{f.lang === "bn" ? x.service_bn : x.service_en}{x.note_bn ? <><br /><span className="muted">{x.note_bn}</span></> : null}</td>
                <td className="num">{x.official_fee === null ? <Unknown rti="citizen-charter" /> : x.official_fee === 0 ? t("বিনামূল্যে", "Free") : f.takaFull(x.official_fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="info-note">
        <Info size={20} aria-hidden />
        <p>
          {t("সব সময় সরকারি ফি দিয়ে রসিদ নিন। নির্ধারিত ফি-র বেশি চাওয়া হলে বা কাজ আটকে থাকলে ", "Always pay the official fee and take a receipt. If you're asked for more, or your work is stuck, ")}
          <Link to="/rights/complain">{t("কোথায় যাবেন দেখুন →", "see where to go →")}</Link>
        </p>
      </div>
    </>
  );
}
