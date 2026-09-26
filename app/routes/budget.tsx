import { AlertTriangle, ChevronDown } from "lucide-react";
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/budget";
import { Amount } from "../components/Amount";
import { Bars } from "../components/Bars";
import { ShareButtons } from "../components/ShareButtons";
import { SourceBadge } from "../components/SourceBadge";
import { CATEGORIES } from "../data/categories";
import { loadDataset } from "../data/load.server";
import { docRefs, type DocRef } from "../data/refs";
import { compareUnions, summarizeYear, yearsFor, type CategoryTotal } from "../lib/aggregate";
import { perHousehold, toBnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { KIND_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  const fy = data?.fy ? ` ${toBnDigits(data.fy)}` : "";
  return pageMeta(`কাতুলী ইউনিয়নের বাজেট${fy}`, "আয় কোথা থেকে, খরচ কোথায় — খাতওয়ারি হিসাব, উৎসসহ। পাশের ইউনিয়নের সাথে তুলনা।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const id = ds.union.id;
  const years = yearsFor(ds.budget, id);
  if (params.year && !years.includes(params.year)) throw data(null, { status: 404 });
  const fy = params.year ?? years[0] ?? null;
  const summary = fy ? summarizeYear(ds.budget, ds.reportedTotals, id, fy) : null;
  const comparison = compareUnions(ds.budget, ds.reportedTotals, [
    { id, name_bn: ds.union.name_bn, name_en: ds.union.name_en, households: ds.union.households },
    ...ds.union.comparisons,
  ]);
  const docIds = summary ? [...summary.incomeByCategory, ...summary.expenseByCategory].flatMap((c) => c.lines.map((l) => l.source_doc)) : [];
  return { unionId: id, households: ds.union.households, years, fy, summary, comparison, docs: docRefs(ds.documents, docIds) };
}

function CategoryList({ cats, tone, docs }: { cats: CategoryTotal[]; tone: "income" | "expense"; docs: Record<string, DocRef> }) {
  const f = useFmt();
  const t = useT();
  return (
    <div>
      {cats.map((c) => {
        const cat = CATEGORIES[c.category];
        return (
          <details key={c.category} className="cat">
            <summary>
              <Bars tone={tone} items={[{ key: c.category, label: cat[f.lang], amount: c.amount, icon: cat.icon }]} />
              <span className="muted small-link"><ChevronDown size={16} aria-hidden /> {t(`${f.digits(c.lines.length)}টি খাত দেখুন`, `See ${c.lines.length} line items`)}</span>
            </summary>
            <table className="lines">
              <thead><tr><th>{t("খাত", "Head")}</th><th className="num">{t("টাকা", "Taka")}</th><th>{t("উৎস", "Source")}</th></tr></thead>
              <tbody>
                {c.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{f.lang === "en" && l.head_en ? l.head_en : l.head_bn}</td>
                    <td className="num">{f.takaFull(l.amount)}</td>
                    <td><SourceBadge type={l.source_type} doc={docs[l.source_doc]} /></td>
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

export function EmptyYear() {
  const t = useT();
  return (
    <div className="warn" role="status">
      <AlertTriangle aria-hidden />
      <p>
        {t("এই বছরের বাজেটের তথ্য প্রকাশিত হয়নি। ", "This year's budget has not been published. ")}
        <Link to="/rights/rti?item=budget-current">{t("তথ্য অধিকার আইনে চেয়ে আবেদন করুন →", "Request it under the RTI Act →")}</Link>
      </p>
    </div>
  );
}

export default function Budget() {
  const { unionId, households, years, fy, summary, comparison, docs } = useLoaderData<typeof loader>();
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
            <Link key={y} to={`/budget/${y}`} className={`chip${y === fy ? " active" : ""}`} aria-current={y === fy ? "page" : undefined}>{f.fy(y)}</Link>
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
            <p className="muted">{t(`${KIND_LABEL[summary.kind].bn} বাজেট`, `${KIND_LABEL[summary.kind].en} budget`)}</p>
            <dl className="kv">
              <dt>{t("মোট আয়", "Total income")}</dt><dd><Amount value={income} full /></dd>
              <dt>{t("মোট খরচ", "Total spending")}</dt><dd><Amount value={summary.expense === 0 && summary.reportedExpense === null ? null : summary.reportedExpense ?? summary.expense} full /></dd>
              <dt>{t("প্রতি পরিবারে আয়", "Income per household")}</dt><dd><Amount value={income !== null ? perHousehold(income, households) : null} full /></dd>
            </dl>
            {summary.reportedIncome !== null && summary.reportedIncome !== summary.income ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট আয় ${f.takaFull(summary.reportedIncome)}, কিন্তু খাতগুলো যোগ করলে হয় ${f.takaFull(summary.income)}। পার্থক্য: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}।`,
                `The document states total income of ${f.takaFull(summary.reportedIncome)}, but its line items add up to ${f.takaFull(summary.income)}. Difference: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}.`,
              )}</p>
            ) : null}
            {summary.reportedExpense !== null && summary.reportedExpense !== summary.expense ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট খরচ ${f.takaFull(summary.reportedExpense)}, খাতগুলোর যোগফল ${f.takaFull(summary.expense)}।`,
                `The document states total spending of ${f.takaFull(summary.reportedExpense)}; line items add up to ${f.takaFull(summary.expense)}.`,
              )}</p>
            ) : null}
          </section>

          <h2>{t("আয় কোথা থেকে", "Where the money comes from")}</h2>
          <CategoryList cats={summary.incomeByCategory} tone="income" docs={docs} />
          <h2>{t("খরচ কোথায়", "Where it is spent")}</h2>
          {summary.expenseByCategory.length > 0 ? <CategoryList cats={summary.expenseByCategory} tone="expense" docs={docs} /> : <p className="muted">{t("খরচের খাতওয়ারি হিসাব প্রকাশিত হয়নি।", "No spending breakdown has been published.")}</p>}
        </>
      )}

      {comparison.length > 0 ? (
        <section>
          <h2>{t("পাশের ইউনিয়নের সাথে তুলনা (প্রতি পরিবারে আয়)", "Compared with neighbouring unions (income per household)")}</h2>
          <p className="muted">{t("প্রতিটি ইউনিয়নের সর্বশেষ পাওয়া বছরের তথ্য — বছর আলাদা হতে পারে, তাই সরাসরি তুলনায় সাবধান।", "Each union's latest available year — years differ, so compare with care.")}</p>
          <Bars tone="income" format="takaFull" items={comparison.map((c) => ({ key: c.id, label: f.lang === "bn" ? c.name_bn : c.name_en, note: f.fy(c.fiscalYear), amount: c.perHousehold, highlight: c.id === unionId }))} />
        </section>
      ) : null}

      <ShareButtons title={t("কাতুলী ইউনিয়নের বাজেট", "Katuli Union budget")} />
    </>
  );
}
