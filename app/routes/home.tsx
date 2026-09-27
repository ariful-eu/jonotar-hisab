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

  const top = (xs: ReturnType<typeof categoryItems>) => xs.slice(0, 4);
  const incomeItems = summary ? categoryItems(summary.incomeByCategory, f.lang) : [];
  const expenseItems = summary ? categoryItems(summary.expenseByCategory, f.lang) : [];

  return (
    <>
      <h1>{t(TITLE, "Where does Katuli Union's money come from, and where does it go?")}</h1>
      <p className="intro">{t(
        "“জনতার হিসাব” একটি স্বাধীন নাগরিক উদ্যোগ। সরকারি কাগজপত্র থেকে কাতুলী ইউনিয়ন পরিষদের টাকার হিসাব এখানে সহজ ভাষায় দেওয়া হয়েছে — যাতে আপনি জানতে ও প্রশ্ন করতে পারেন।",
        "“Jonotar Hisab” is an independent citizens' initiative. It turns government documents into a plain account of Katuli Union Parishad's money, so you can know and ask questions.",
      )}</p>

      {summary && headline !== null ? (
        <section className="card" aria-labelledby="hero-label">
          <p id="hero-label" className="muted">
            {reconstructed
              ? t(`${f.fy(summary.fiscalYear)} অর্থবছরে অন্তত এত টাকা এসেছে (অন্য সরকারি অফিসের তালিকা থেকে — আংশিক)`, `At least this much came in FY ${summary.fiscalYear} (from other offices' lists — partial)`)
              : t(`ইউনিয়নের সর্বশেষ প্রকাশিত বাজেট (${f.fy(summary.fiscalYear)}) অনুযায়ী বছরে মোট আয়`, `Yearly income in the union's latest published budget (FY ${summary.fiscalYear})`)}
          </p>
          <p className="hero-number">{f.taka(headline)}</p>
          {perHh !== null ? (
            <p>
              {t(`পরিবারপ্রতি বাজেট প্রায় ${f.takaFull(perHh)}`, `Budget per household: about ${f.takaFull(perHh)}`)}{" "}
              <span className="muted">({t(`${f.num(union.households)} পরিবার, আদমশুমারি ${f.digits(union.census_year)}`, `${f.num(union.households)} households, census ${union.census_year}`)})</span>
            </p>
          ) : null}
          {staleYears !== null && staleYears >= 2 ? (
            <div className="warn" role="note">
              <AlertTriangle aria-hidden />
              <p>
                {t(`এই বাজেট ${f.digits(staleYears)} বছর আগের। এর পরে ইউনিয়ন আর কোনো বাজেট প্রকাশ করেনি, অথচ আইন অনুযায়ী প্রতি বছর প্রকাশ্য সভায় বাজেট দেওয়ার কথা। `, `This budget is ${staleYears} years old. The union has not published one since, although the law requires a public budget every year. `)}
                <Link to="/rights/rti?item=budget-current">{t("এ বছরের বাজেট চেয়ে আবেদন করুন →", "Ask for this year's budget →")}</Link>
              </p>
            </div>
          ) : null}
          <h2 className="h3">{t("টাকা আসে কোথা থেকে", "Where the money comes from")}</h2>
          <Bars tone="income" items={top(incomeItems)} />
          <h2 className="h3">{t("খরচ হয় কোথায়", "Where it is spent")}</h2>
          <Bars tone="expense" items={top(expenseItems)} />
          <Link className="btn btn-primary" to={`/budget/${summary.fiscalYear}`}>{t("সব খাতের পুরো হিসাব দেখুন", "See every item")}</Link>
        </section>
      ) : (
        <div className="warn" role="alert">
          <AlertTriangle aria-hidden />
          <p>
            {t("কাতুলী ইউনিয়ন পরিষদের প্রকাশিত কোনো বাজেট আমরা খুঁজে পাইনি। ", "We could not find any budget published by Katuli Union Parishad. ")}
            <Link to="/rights/rti?item=budget-current">{t("বাজেট চেয়ে আবেদন করুন →", "Ask for it →")}</Link>
          </p>
        </div>
      )}

      <h2>{t("কী জানতে চান?", "What would you like to know?")}</h2>
      <SectionTiles />

      {newerPartial.length > 0 ? (
        <section className="card" aria-labelledby="newer-h">
          <h2 id="newer-h" className="h3">{t("এর পরের বছরগুলোর খবর", "What we know about later years")}</h2>
          <p className="muted">{t("ইউনিয়ন এসব বছরের বাজেট প্রকাশ করেনি। অন্য সরকারি অফিসের তালিকায় কাতুলী ইউনিয়নের নামে যা পাওয়া গেছে, শুধু সেটুকু:", "The union did not publish these budgets. Only what other government offices list for Katuli Union:")}</p>
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

      <ShareButtons title={t(TITLE, "Katuli Union budget")} poster={`/poster/home/${union.id}`} />
    </>
  );
}
