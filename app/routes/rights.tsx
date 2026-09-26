import { Link } from "react-router";
import { RIGHTS_TOPICS } from "../content/rights";
import { useLang, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("আপনার অধিকার", "তথ্য চাওয়া, ওয়ার্ড সভা, প্রকাশ্য বাজেট সভা, অভিযোগ — ইউনিয়ন পরিষদের কাছে জবাব চাওয়ার আইনি পথ।");
}

export default function Rights() {
  const t = useT();
  const { lang } = useLang();
  return (
    <>
      <h1>{t("আপনার অধিকার", "Your rights")}</h1>
      <p>{t("ইউনিয়ন পরিষদের টাকা জনগণের টাকা। আইন আপনাকে প্রশ্ন করার, তথ্য চাওয়ার আর সিদ্ধান্তে অংশ নেওয়ার অধিকার দিয়েছে।", "Union Parishad money is public money. The law gives you the right to ask, to get information, and to take part in decisions.")}</p>
      {RIGHTS_TOPICS.map((x) => (
        <Link key={x.key} to={`/rights/${x.key}`} className="card list-link">
          <h2 className="h3">{lang === "bn" ? x.title_bn : x.title_en}</h2>
          <p>{lang === "bn" ? x.summary_bn : x.summary_en}</p>
        </Link>
      ))}
    </>
  );
}
