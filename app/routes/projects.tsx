import { useState, type ChangeEvent } from "react";
import { Link, useLoaderData } from "react-router";
import { Amount } from "../components/Amount";
import { loadDataset } from "../data/load.server";
import { PROJECT_STATUSES, SCHEMES } from "../data/schemas";
import { useFmt, useT } from "../lib/i18n";
import { PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";
import { filterProjects, type ProjectFilter } from "../lib/projects";

export function meta() {
  return pageMeta("কাতুলী ইউনিয়নের উন্নয়ন প্রকল্প", "কোন ওয়ার্ডে কোন প্রকল্প, কত টাকা, কাজের অবস্থা — এবং স্বেচ্ছাসেবকদের সরেজমিন পর্যবেক্ষণ।");
}

export async function loader() {
  const ds = loadDataset();
  const visits: Record<string, number> = {};
  for (const v of ds.verifications) visits[v.project_id] = (visits[v.project_id] ?? 0) + 1;
  return { projects: ds.projects, visits };
}

export default function Projects() {
  const { projects, visits } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const [filter, setFilter] = useState<ProjectFilter>({ ward: "", scheme: "", status: "" });
  const shown = filterProjects(projects, filter);
  const set = (k: keyof ProjectFilter) => (e: ChangeEvent<HTMLSelectElement>) => setFilter({ ...filter, [k]: e.target.value });

  return (
    <>
      <h1>{t("উন্নয়ন কাজ", "Development works")}</h1>
      <p>{t("ইউনিয়নে কোথায় কোন কাজ হচ্ছে বা হওয়ার কথা — কত টাকার, কে করছে, আর স্বেচ্ছাসেবকেরা গিয়ে কী দেখেছেন। নিজের এলাকার কাজ খুঁজতে ওয়ার্ড বেছে নিন।", "Works in the union — how much, who does them, and what volunteers saw. Pick your ward to find local works.")}</p>
      <div className="filters">
        <label>{t("ওয়ার্ড", "Ward")}
          <select value={filter.ward} onChange={set("ward")}>
            <option value="">{t("সব", "All")}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={String(n)}>{f.digits(n)}</option>)}
            <option value="none">{t("উল্লেখ নেই", "Not stated")}</option>
          </select>
        </label>
        <label>{t("কোন খাতের টাকা", "Funding source")}
          <select value={filter.scheme} onChange={set("scheme")}>
            <option value="">{t("সব", "All")}</option>
            {SCHEMES.map((s) => <option key={s} value={s}>{SCHEME_LABEL[s][f.lang]}</option>)}
          </select>
        </label>
        <label>{t("অবস্থা", "Status")}
          <select value={filter.status} onChange={set("status")}>
            <option value="">{t("সব", "All")}</option>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABEL[s][f.lang]}</option>)}
          </select>
        </label>
      </div>
      <p className="muted">{t(`${f.digits(shown.length)}টি কাজ`, `${shown.length} works`)}</p>
      {shown.map((p) => (
        <Link key={p.id} to={`/projects/${p.id}`} className="card list-link">
          <h3>{f.lang === "en" && p.name_en ? p.name_en : p.name_bn}</h3>
          <div className="chips">
            <span className="chip">{SCHEME_LABEL[p.scheme][f.lang]}</span>
            <span className="chip">{p.ward ? t(`ওয়ার্ড ${f.digits(p.ward)}`, `Ward ${p.ward}`) : t("ওয়ার্ড উল্লেখ নেই", "Ward not stated")}</span>
            <span className="chip">{PROJECT_STATUS_LABEL[p.status][f.lang]}</span>
            {visits[p.id] ? <span className="chip chip-observed">{t(`${f.digits(visits[p.id])} বার সরেজমিনে দেখা`, `Visited ${visits[p.id]}×`)}</span> : null}
          </div>
          <p><Amount value={p.amount} full /></p>
        </Link>
      ))}
    </>
  );
}
