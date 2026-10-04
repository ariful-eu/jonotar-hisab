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
      <h1>{t("নাগরিক গাইড", "Citizen guide")}</h1>
      <p>{t("ইউনিয়ন পরিষদের কাজে কীভাবে অংশ নেবেন, দরকারি তথ্য কীভাবে চাইবেন, আর সমস্যা হলে কোথায় যাবেন — সহজ ভাষায়, ধাপে ধাপে।", "How to take part in your union's work, ask for information you need, and get help with a problem — step by step.")}</p>
      {RIGHTS_TOPICS.map((x) => (
        <Link key={x.key} to={`/rights/${x.key}`} className="card list-link">
          <h2 className="h3">{lang === "bn" ? x.title_bn : x.title_en}</h2>
          <p>{lang === "bn" ? x.summary_bn : x.summary_en}</p>
        </Link>
      ))}
    </>
  );
}
