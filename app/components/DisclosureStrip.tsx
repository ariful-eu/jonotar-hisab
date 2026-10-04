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
      <h2 id="disc-h" className="h3">{t("তথ্য সংগ্রহের অবস্থা", "Information we're still gathering")}</h2>
      <p className="scoreline">
        <strong>{t(`${f.digits(items.length)}টির মধ্যে অনলাইনে পাওয়া গেছে ${f.digits(yes)}টি`, `${yes} of ${items.length} found online`)}</strong>
      </p>
      <p className="muted">{t("আইন অনুযায়ী এই কাগজগুলো জনগণের জন্য খোলা। এখনো অনলাইনে পাইনি — আপনার কাছে থাকলে আমাদের দিন, অথবা সহজ আবেদনে চেয়ে নিন।", "By law these documents are open to the public. We haven't found them online yet — share them if you have them, or ask for them with a simple application.")}</p>
      <ul className="scorecard">
        {shown.map((i) => (
          <li key={i.id}>
            <StatusIcon s={i.published} />
            <span className="grow">{f.lang === "bn" ? i.requirement_bn : i.requirement_en}</span>
            {i.published !== "yes" ? <Link className="small-link" to={`/rights/rti?item=${i.id}`}>{t("কীভাবে চাইবেন", "How to ask")}</Link> : null}
          </li>
        ))}
      </ul>
      {!full && items.length > shown.length ? <Link to="/documents">{t("সব দেখুন →", "See all →")}</Link> : null}
    </section>
  );
}
