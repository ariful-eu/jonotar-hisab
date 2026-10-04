import { MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { SearchBox } from "../components/SearchBox";
import { MoreSections, QuickActions } from "../components/SectionTiles";
import { ShareButtons } from "../components/ShareButtons";
import { loadDataset } from "../data/load.server";
import { headlineYear, summarizeYear } from "../lib/aggregate";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";
import { NoticeRow } from "../components/NoticeRow";
import { noticesFeed } from "../lib/notices";
import { getMyWard } from "../lib/prefs";

const TITLE = "কাতুলী ইউনিয়নের দরকারি সব তথ্য, এক জায়গায়";

export function meta() {
  return pageMeta(TITLE, "জন্ম নিবন্ধন, সনদ, ভাতা, জরুরি নম্বর, নোটিশ, উন্নয়ন কাজ আর ইউনিয়নের বাজেট — কাতুলী ইউনিয়ন, টাঙ্গাইল সদরের মানুষের জন্য সহজ ভাষায়।");
}

export async function loader() {
  const ds = loadDataset();
  const id = ds.union.id;
  const { year } = headlineYear(ds.budget, id);
  const s = year ? summarizeYear(ds.budget, ds.reportedTotals, id, year) : null;
  const ownBudget = s && s.sourceTypes.includes("union") ? { fy: s.fiscalYear, total: s.reportedIncome ?? s.income } : null;
  return {
    facts: {
      population: ds.union.population,
      households: ds.union.households,
      census_year: ds.union.census_year,
      wards: ds.union.wards.length,
      villages: ds.union.villages_bn.length,
      area: ds.union.area_km2,
    },
    ownBudget,
    notices: noticesFeed(ds.documents, ds.tenders).slice(0, 5),
  };
}

function MyWardCard() {
  const t = useT();
  const f = useFmt();
  const [ward, setWard] = useState<number | null>(null);
  useEffect(() => setWard(getMyWard()), []);
  if (ward === null) return null;
  return (
    <Link to={`/ward/${ward}`} className="card list-link my-ward">
      <MapPin size={22} aria-hidden />
      <span className="grow"><strong>{t(`আমার ওয়ার্ড: ${f.digits(ward)} নং`, `My ward: ${ward}`)}</strong><br /><span className="muted">{t("আপনার এলাকার কাজ, ভাতা ও ওয়ার্ড সভার তথ্য", "Works, allowances and meetings in your area")}</span></span>
    </Link>
  );
}

export default function Home() {
  const { facts, ownBudget, notices } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const stats = [
    { label: t("জনসংখ্যা", "Population"), value: f.num(facts.population) },
    { label: t("পরিবার", "Households"), value: f.num(facts.households) },
    { label: t("ওয়ার্ড", "Wards"), value: f.digits(facts.wards) },
    { label: t("গ্রাম", "Villages"), value: f.digits(facts.villages) },
    { label: t("আয়তন", "Area"), value: t(`${f.num(facts.area)} বর্গকিমি`, `${facts.area} km²`) },
  ];

  return (
    <>
      <section className="home-hero">
        <h1>{t(TITLE, "Everything useful about Katuli Union, in one place")}</h1>
        <p className="intro">{t(
          "সরকারি সেবা কীভাবে পাবেন, কোন ভাতা পেতে পারেন, জরুরি নম্বর, এলাকার নোটিশ ও উন্নয়ন কাজ — কাতুলী ইউনিয়নের মানুষের জন্য সহজ ভাষায়।",
          "How to get government services, which allowances you may get, useful numbers, local notices and works — in plain language for the people of Katuli Union.",
        )}</p>
        <SearchBox />
      </section>

      <QuickActions />
      <MyWardCard />

      <section className="card" aria-labelledby="glance-h">
        <h2 id="glance-h" className="h3">{t("এক নজরে কাতুলী ইউনিয়ন", "Katuli Union at a glance")}</h2>
        <dl className="stats">
          {stats.map((s) => (
            <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
          ))}
          {ownBudget ? (
            <div><dt>{t("বার্ষিক বাজেট", "Yearly budget")}</dt><dd><Link to={`/budget/${ownBudget.fy}`}>{f.taka(ownBudget.total)}</Link></dd></div>
          ) : null}
        </dl>
        <p className="muted">{t(
          `জনসংখ্যা ও পরিবার: আদমশুমারি ${f.digits(facts.census_year)}।${ownBudget ? ` বাজেট: ইউনিয়নের সর্বশেষ প্রকাশিত (${f.fy(ownBudget.fy)})।` : ""}`,
          `Population and households: Census ${facts.census_year}.${ownBudget ? ` Budget: latest published by the union (FY ${ownBudget.fy}).` : ""}`,
        )}</p>
      </section>

      <section aria-labelledby="latest-h">
        <h2 id="latest-h">{t("সর্বশেষ নোটিশ ও টেন্ডার", "Latest notices & tenders")}</h2>
        {notices.length === 0 ? <p className="muted">{t("এখনো কোনো নোটিশ নেই।", "No notices yet.")}</p> : <ul className="notices">{notices.map((x) => <NoticeRow key={x.id} x={x} />)}</ul>}
        <p><Link to="/notices">{t("সব নোটিশ দেখুন →", "See all notices →")}</Link></p>
      </section>

      <h2>{t("আরও দেখুন", "More")}</h2>
      <MoreSections />

      <a className="emergency-strip" href="tel:999">
        <Phone size={22} aria-hidden />
        <span className="grow"><strong>{t("জরুরি প্রয়োজনে ৯৯৯", "Emergency: 999")}</strong><br /><span>{t("পুলিশ, ফায়ার সার্ভিস, অ্যাম্বুলেন্স — বিনামূল্যে, ২৪ ঘণ্টা", "Police, fire, ambulance — free, 24 hours")}</span></span>
        <span className="call">{t("কল করুন", "Call")}</span>
      </a>
      <p className="center"><Link to="/contacts">{t("অন্যান্য দরকারি নম্বর →", "Other useful numbers →")}</Link></p>

      <ShareButtons title={t(TITLE, "Jonotar Hisab — Katuli Union")} poster="/poster/home/katuli" />
    </>
  );
}
