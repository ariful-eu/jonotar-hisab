import { Link } from "react-router";
import { useFmt, useT } from "../lib/i18n";
import { StatusIcon } from "./StatusIcon";

export type DisclosureItem = { id: string; requirement_bn: string; requirement_en: string; published: "yes" | "no" | "partial" };

export function DisclosureStrip({ items, full = false }: { items: DisclosureItem[]; full?: boolean }) {
  const t = useT();
  const f = useFmt();
  if (items.length === 0) return null;
  const yes = items.filter((i) => i.published === "yes").length;
  const shown = full ? items : items.slice(0, 5);
  return (
    <section className="card" aria-labelledby="disc-h">
      <h2 id="disc-h" className="h3">{t("আইন অনুযায়ী যা প্রকাশ করার কথা", "What the law says must be made public")}</h2>
      <p className="scoreline">
        <strong>{t(`${f.digits(items.length)}টির মধ্যে ${f.digits(yes)}টি প্রকাশিত`, `${yes} of ${items.length} published`)}</strong>
      </p>
      <ul className="scorecard">
        {shown.map((i) => (
          <li key={i.id}>
            <StatusIcon s={i.published} />
            <span className="grow">{f.lang === "bn" ? i.requirement_bn : i.requirement_en}</span>
            {i.published !== "yes" ? <Link className="small-link" to={`/rights/rti?item=${i.id}`}>{t("চেয়ে আবেদন", "Request")}</Link> : null}
          </li>
        ))}
      </ul>
      {!full && items.length > shown.length ? <Link to="/documents">{t("সব দেখুন →", "See all →")}</Link> : null}
    </section>
  );
}
