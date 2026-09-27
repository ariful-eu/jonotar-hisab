import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/budget";
import { Amount } from "../components/Amount";
import { Bars } from "../components/Bars";
import { ShareButtons } from "../components/ShareButtons";
import { SourceBadge } from "../components/SourceBadge";
import { CATEGORIES } from "../data/categories";
import { loadDataset } from "../data/load.server";
import { docRefs, type DocRef } from "../data/refs";
import { compareUnions, summarizeYear, yearsFor, type CategoryTotal, type Comparison as ComparisonRow } from "../lib/aggregate";
import { perHousehold, toBnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { KIND_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  const fy = data?.fy ? ` ${toBnDigits(data.fy)}` : "";
  return pageMeta(`কাতুলী ইউনিয়নের বাজেট${fy}`, "টাকা কোথা থেকে আসে, কোথায় খরচ হয় — খাতওয়ারি বাজেট, উৎসসহ। পাশের ইউনিয়নের সাথে তুলনা।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const id = ds.union.id;
  const years = yearsFor(ds.budget, id);
  if (params.year && !years.includes(params.year)) throw data(null, { status: 404 });
  const fy = params.year ?? years[0] ?? null;
  const summary = fy ? summarizeYear(ds.budget, ds.reportedTotals, id, fy) : null;
  const comparison = compareUnions(ds.budget, ds.reportedTotals, [
    { id, name_bn: `${ds.union.name_bn} ইউনিয়ন`, name_en: `${ds.union.name_en} Union`, households: ds.union.households },
    ...ds.union.comparisons,
  ]);
  const docIds = summary ? [...summary.incomeByCategory, ...summary.expenseByCategory].flatMap((c) => c.lines.map((l) => l.source_doc)) : [];
  const counts = new Map<string, number>();
  for (const d of docIds) counts.set(d, (counts.get(d) ?? 0) + 1);
  const primaryDoc = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const ownYears = new Set(yearsFor(ds.budget.filter((l) => l.source_type === "union"), id));
  return { unionId: id, households: ds.union.households, years, partialYears: years.filter((y) => !ownYears.has(y)), fy, summary, comparison, primaryDoc, docs: docRefs(ds.documents, docIds) };
}

function CategoryList({ cats, tone, docs, primaryDoc }: { cats: CategoryTotal[]; tone: "income" | "expense"; docs: Record<string, DocRef>; primaryDoc: string | null }) {
  const f = useFmt();
  const t = useT();
  const max = Math.max(0, ...cats.map((c) => c.amount));
  return (
    <div>
      {cats.map((c) => {
        const cat = CATEGORIES[c.category];
        return (
          <details key={c.category} className="cat">
            <summary>
              <Bars tone={tone} max={max} items={[{ key: c.category, label: cat[f.lang], amount: c.amount, icon: cat.icon }]} />
              <span className="muted small-link"><ChevronDown size={16} aria-hidden /> {t(`${f.digits(c.lines.length)}টি খাত দেখুন`, `See ${c.lines.length} line items`)}</span>
            </summary>
            <table className="lines">
              <thead><tr><th>{t("খাত", "Item")}</th><th className="num">{t("টাকা", "Taka")}</th></tr></thead>
              <tbody>
                {c.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{f.lang === "en" && l.head_en ? l.head_en : l.head_bn}{l.source_doc !== primaryDoc ? <><br /><SourceBadge type={l.source_type} doc={docs[l.source_doc]} /></> : null}</td>
                    <td className="num">{f.takaFull(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        );
      })}
    </div>
  );
}

function Comparison({ rows, unionId }: { rows: ComparisonRow[]; unionId: string }) {
  const t = useT();
  const f = useFmt();
  const [metric, setMetric] = useState<"perHousehold" | "total">("perHousehold");
  const sorted = [...rows].sort((a, b) => (metric === "total" ? b.income - a.income : (b.perHousehold ?? -1) - (a.perHousehold ?? -1)));
  return (
    <section aria-labelledby="cmp-h">
      <h2 id="cmp-h">{t("পাশের ইউনিয়নের সাথে তুলনা", "Compared with neighbouring unions")}</h2>
      <div className="chips" role="group" aria-label={t("কী দিয়ে তুলনা", "Compare by")}>
        <button type="button" className={`chip chip-btn${metric === "perHousehold" ? " active" : ""}`} aria-pressed={metric === "perHousehold"} onClick={() => setMetric("perHousehold")}>{t("পরিবারপ্রতি বাজেট", "Per household")}</button>
        <button type="button" className={`chip chip-btn${metric === "total" ? " active" : ""}`} aria-pressed={metric === "total"} onClick={() => setMetric("total")}>{t("মোট বাজেট", "Total budget")}</button>
      </div>
      <p className="muted">{metric === "perHousehold"
        ? t("বড় ও ছোট ইউনিয়নকে ন্যায্যভাবে মেলাতে মোট বাজেটকে পরিবারের সংখ্যা দিয়ে ভাগ করা হয়েছে (আদমশুমারি ২০২২)।", "Total budget divided by households (Census 2022), so big and small unions compare fairly.")
        : t("মোট বাজেট — বড় ইউনিয়নে স্বাভাবিকভাবেই বেশি হয়।", "Total budget — naturally larger for bigger unions.")}{" "}
        {t("প্রতিটি ইউনিয়নের সর্বশেষ পাওয়া বছরের তথ্য; বছর আলাদা, তাই সাবধানে তুলনা করুন।", "Each union's latest available year; years differ, so compare with care.")}</p>
      <Bars
        tone="income"
        format={metric === "total" ? "taka" : "takaFull"}
        items={sorted.map((c) => ({
          key: c.id,
          label: f.lang === "bn" ? c.name_bn : c.name_en,
          note: metric === "total"
            ? `${f.fy(c.fiscalYear)} · ${t("পরিবারপ্রতি", "per household")} ${c.perHousehold !== null ? f.takaFull(c.perHousehold) : t("তথ্য নেই", "n/a")}`
            : `${f.fy(c.fiscalYear)} · ${t("মোট", "total")} ${f.taka(c.income)}`,
          amount: metric === "total" ? c.income : c.perHousehold,
          highlight: c.id === unionId,
        }))}
      />
    </section>
  );
}

export function EmptyYear() {
  const t = useT();
  return (
    <div className="warn" role="status">
      <AlertTriangle aria-hidden />
      <p>
        {t("এই বছরের বাজেটের তথ্য প্রকাশিত হয়নি। ", "This year's budget has not been published. ")}
        <Link to="/rights/rti?item=budget-current">{t("তথ্য চান — আবেদনপত্র তৈরি করুন →", "Ask for it — make an RTI letter →")}</Link>
      </p>
    </div>
  );
}

export default function Budget() {
  const { unionId, households, years, partialYears, fy, summary, comparison, primaryDoc, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const lowReliability = Object.values(docs).some((d) => d.reliability === "low");
  const reconstructed = summary ? !summary.sourceTypes.includes("union") : false;
  const income = summary ? summary.reportedIncome ?? summary.income : null;

  return (
    <>
      <h1>{t("বাজেট", "Budget")}{fy ? ` ${f.fy(fy)}` : ""}</h1>
      {years.length > 0 ? (
        <nav className="chips" aria-label={t("অর্থবছর", "Fiscal year")}>
          {years.map((y) => (
            <Link key={y} to={`/budget/${y}`} className={`chip${y === fy ? " active" : ""}`} aria-current={y === fy ? "page" : undefined}>{f.fy(y)}{partialYears.includes(y) ? t(" (আংশিক)", " (partial)") : ""}</Link>
          ))}
        </nav>
      ) : null}

      {!summary ? <EmptyYear /> : (
        <>
          {reconstructed ? (
            <div className="warn"><AlertTriangle aria-hidden /><p>{t("ইউনিয়ন পরিষদ এই বছরের বাজেট প্রকাশ করেনি। নিচের সংখ্যাগুলো উপজেলা/জেলা/মন্ত্রণালয়ের বরাদ্দ তালিকা থেকে নেওয়া — তাই আংশিক।", "The Union Parishad did not publish this year's budget. These figures come from upazila/district/ministry allocation lists, so they are partial.")}</p></div>
          ) : null}
          {lowReliability ? (
            <div className="warn"><AlertTriangle aria-hidden /><p>{t("উৎস নথিতে অসঙ্গতি আছে (যেমন দুটি ভিন্ন তারিখ/সভাপতির নাম)। সংখ্যাগুলো সাবধানে ব্যবহার করুন।", "The source document has inconsistencies (e.g. two different dates or chairs). Use these figures with care.")}</p></div>
          ) : null}

          <section className="card">
            <p className="muted">{t(`${KIND_LABEL[summary.kind].bn} হিসাব`, `${KIND_LABEL[summary.kind].en} figures`)}{summary.kind === "proposed" ? t(" — বছরের শুরুতে যে পরিকল্পনা করা হয়েছিল", " — planned at the start of the year") : summary.kind === "actual" ? t(" — বছর শেষে আসলে যা হয়েছে", " — what actually happened") : ""}</p>
            {primaryDoc && docs[primaryDoc] ? <p className="muted">{t("উৎস: ", "Source: ")}{f.lang === "en" && docs[primaryDoc].title_en ? docs[primaryDoc].title_en : docs[primaryDoc].title_bn} <SourceBadge type={summary.sourceTypes[0]} doc={docs[primaryDoc]} /></p> : null}
            <dl className="kv">
              <dt>{t("মোট বাজেট", "Total budget")}</dt><dd><Amount value={income} full /></dd>
              <dt>{t("মোট খরচ", "Total spending")}</dt><dd><Amount value={summary.expense === 0 && summary.reportedExpense === null ? null : summary.reportedExpense ?? summary.expense} full /></dd>
              <dt>{t("পরিবারপ্রতি বাজেট", "Budget per household")}</dt><dd><Amount value={income !== null ? perHousehold(income, households) : null} full /></dd>
            </dl>
            {summary.reportedIncome !== null && summary.reportedIncome !== summary.income ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট বাজেট ${f.takaFull(summary.reportedIncome)}, কিন্তু খাতগুলো যোগ করলে হয় ${f.takaFull(summary.income)}। পার্থক্য: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}।`,
                `The document states a total budget of ${f.takaFull(summary.reportedIncome)}, but its line items add up to ${f.takaFull(summary.income)}. Difference: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}.`,
              )}</p>
            ) : null}
            {summary.reportedExpense !== null && summary.reportedExpense !== summary.expense ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট খরচ ${f.takaFull(summary.reportedExpense)}, খাতগুলোর যোগফল ${f.takaFull(summary.expense)}।`,
                `The document states total spending of ${f.takaFull(summary.reportedExpense)}; line items add up to ${f.takaFull(summary.expense)}.`,
              )}</p>
            ) : null}
          </section>

          <h2>{t("টাকা আসে কোথা থেকে", "Where the money comes from")}</h2>
          <CategoryList cats={summary.incomeByCategory} tone="income" docs={docs} primaryDoc={primaryDoc} />
          <h2>{t("খরচ হয় কোথায়", "Where it is spent")}</h2>
          {summary.expenseByCategory.length > 0 ? <CategoryList cats={summary.expenseByCategory} tone="expense" docs={docs} primaryDoc={primaryDoc} /> : <p className="muted">{t("খরচের খাতওয়ারি হিসাব প্রকাশিত হয়নি।", "No spending breakdown has been published.")}</p>}
        </>
      )}

      {comparison.length > 0 ? <Comparison rows={comparison} unionId={unionId} /> : null}

      <ShareButtons title={t("কাতুলী ইউনিয়নের বাজেট", "Katuli Union budget")} />
    </>
  );
}
