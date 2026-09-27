import { AlertTriangle } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { Bars } from "../components/Bars";
import { DisclosureStrip } from "../components/DisclosureStrip";
import { SectionTiles } from "../components/SectionTiles";
import { ShareButtons } from "../components/ShareButtons";
import { categoryItems } from "../data/categories";
import { loadDataset } from "../data/load.server";
import { fiscalYearOf, fyStart, headlineYear, summarizeYear, yearsFor } from "../lib/aggregate";
import { perHousehold } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { KIND_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

const TITLE = "কাতুলী ইউনিয়নের টাকা কোথা থেকে আসে, কোথায় যায়?";

export function meta() {
  return pageMeta(TITLE, "কাতুলী ইউনিয়ন পরিষদ, টাঙ্গাইল সদর — বাজেট, প্রকল্প, দরপত্র, সেবার ফি, ভাতা ও আপনার অধিকার। স্বাধীন নাগরিক উদ্যোগ।");
}

export async function loader() {
  const ds = loadDataset();
  const id = ds.union.id;
  const { year: latest, newerPartial } = headlineYear(ds.budget, id);
  const latestUnionYear = yearsFor(ds.budget.filter((l) => l.source_type === "union"), id)[0] ?? null;
  return {
    union: { id, households: ds.union.households, census_year: ds.union.census_year },
    summary: latest ? summarizeYear(ds.budget, ds.reportedTotals, id, latest) : null,
    newerPartial: newerPartial.map((fy) => ({ fy, total: summarizeYear(ds.budget, ds.reportedTotals, id, fy)?.income ?? 0 })),
    latestUnionYear,
    currentFy: fiscalYearOf(new Date()),
    disclosures: ds.disclosures.map(({ id, requirement_bn, requirement_en, published }) => ({ id, requirement_bn, requirement_en, published })),
  };
}

export default function Home() {
  const { union, summary, newerPartial, latestUnionYear, currentFy, disclosures } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const headline = summary ? summary.reportedIncome ?? summary.income : null;
  const reconstructed = summary ? !summary.sourceTypes.includes("union") : false;
  const staleYears = latestUnionYear ? fyStart(currentFy) - fyStart(latestUnionYear) : null;
  const perHh = headline !== null ? perHousehold(headline, union.households) : null;

  return (
    <>
      <h1>{t(TITLE, "Where does Katuli Union's money come from, and where does it go?")}</h1>

      {staleYears === null ? (
        <div className="warn" role="alert">
          <AlertTriangle aria-hidden />
          <p>
            {t("কাতুলী ইউনিয়ন পরিষদের প্রকাশিত কোনো বাজেট আমরা খুঁজে পাইনি। ", "We could not find any budget published by Katuli Union Parishad. ")}
            <Link to="/rights/rti?item=budget-current">{t("বাজেট চেয়ে আবেদন করুন →", "Request it →")}</Link>
          </p>
        </div>
      ) : staleYears >= 2 ? (
        <div className="warn" role="alert">
          <AlertTriangle aria-hidden />
          <p>
            {t(
              `ইউনিয়ন পরিষদের নিজের প্রকাশিত সর্বশেষ বাজেট ${f.fy(latestUnionYear!)} অর্থবছরের — ${f.digits(staleYears)} বছর আগের। আইন অনুযায়ী প্রতি বছর প্রকাশ্য সভায় বাজেট দেওয়ার কথা। `,
              `The Union Parishad's own latest published budget is for FY ${latestUnionYear} — ${staleYears} years old. By law a budget must be presented publicly every year. `,
            )}
            <Link to="/rights/rti?item=budget-current">{t("চলতি বাজেট চেয়ে আবেদন করুন →", "Request the current budget →")}</Link>
          </p>
        </div>
      ) : null}

      {summary && headline !== null ? (
        <section className="card" aria-labelledby="hero-label">
          <p id="hero-label" className="muted">
            {reconstructed
              ? t(`${f.fy(summary.fiscalYear)} অর্থবছরে অন্তত এত টাকা এসেছে (অন্য সরকারি অফিসের তালিকা থেকে হিসাব — আংশিক)`, `At least this much came in FY ${summary.fiscalYear} (from other offices' lists — partial)`)
              : t(`${f.fy(summary.fiscalYear)} অর্থবছরের মোট আয় (${KIND_LABEL[summary.kind].bn} বাজেট)`, `Total income, FY ${summary.fiscalYear} (${KIND_LABEL[summary.kind].en} budget)`)}
          </p>
          <p className="hero-number">{f.taka(headline)}</p>
          {perHh !== null ? (
            <p>
              {t(`মানে প্রতি পরিবারের জন্য প্রায় ${f.takaFull(perHh)}`, `About ${f.takaFull(perHh)} per household`)}{" "}
              <span className="muted">({t(`${f.num(union.households)} পরিবার, আদমশুমারি ${f.digits(union.census_year)}`, `${f.num(union.households)} households, census ${union.census_year}`)})</span>
            </p>
          ) : null}
          <h2 className="h3">{t("কোথা থেকে আসে", "Where it comes from")}</h2>
          <Bars tone="income" items={categoryItems(summary.incomeByCategory, f.lang)} />
          <h2 className="h3">{t("কোথায় খরচ হয়", "Where it goes")}</h2>
          <Bars tone="expense" items={categoryItems(summary.expenseByCategory, f.lang)} />
          <Link className="btn btn-primary" to={`/budget/${summary.fiscalYear}`}>{t("পুরো হিসাব দেখুন", "See the full budget")}</Link>
        </section>
      ) : null}

      {newerPartial.length > 0 ? (
        <section className="card" aria-labelledby="newer-h">
          <h2 id="newer-h" className="h3">{t("এর পরের বছরগুলোতে যা জানা গেছে", "What we know about later years")}</h2>
          <p className="muted">{t("ইউনিয়ন এসব বছরের বাজেট প্রকাশ করেনি। অন্য সরকারি অফিসের বরাদ্দ তালিকায় কাতুলী ইউনিয়নের নামে পাওয়া অংশটুকু:", "The union did not publish these budgets. Amounts found for Katuli in other government offices' allocation lists:")}</p>
          <ul className="scorecard">
            {newerPartial.map((p) => (
              <li key={p.fy}>
                <span className="grow"><Link to={`/budget/${p.fy}`}>{t(`${f.fy(p.fy)} অর্থবছর`, `FY ${p.fy}`)}</Link></span>
                <strong>{t(`অন্তত ${f.taka(p.total)}`, `at least ${f.taka(p.total)}`)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DisclosureStrip items={disclosures} />

      <h2>{t("আরও দেখুন", "Explore")}</h2>
      <SectionTiles />

      <ShareButtons title={t(TITLE, "Katuli Union budget")} />
      <p className="no-print"><Link to={`/poster/home/${union.id}`}>{t("নোটিশ বোর্ডের জন্য পোস্টার প্রিন্ট করুন", "Print a notice-board poster")}</Link></p>
    </>
  );
}
