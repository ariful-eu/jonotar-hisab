import { useState } from "react";
import { useLoaderData } from "react-router";
import { NoticeRow } from "../components/NoticeRow";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";
import { noticesFeed } from "../lib/notices";

export function meta() {
  return pageMeta("নোটিশ ও খবর — কাতুলী ইউনিয়ন", "ইউনিয়ন, উপজেলা ও জেলার সর্বশেষ নোটিশ এবং কাতুলী ইউনিয়নের টেন্ডার — এক জায়গায়।");
}

export async function loader() {
  const ds = loadDataset();
  return { items: noticesFeed(ds.documents, ds.tenders) };
}

export default function Notices() {
  const { items } = useLoaderData<typeof loader>();
  const t = useT();
  const [kind, setKind] = useState<"all" | "document" | "tender">("all");
  const shown = items.filter((x) => kind === "all" || x.kind === kind);
  return (
    <>
      <h1>{t("নোটিশ ও খবর", "Notices & news")}</h1>
      <p className="intro">{t("ইউনিয়ন, উপজেলা ও জেলা অফিসের নোটিশ আর কাতুলী ইউনিয়নের কাজের টেন্ডার — নতুনগুলো প্রথমে। আমাদের স্বয়ংক্রিয় ব্যবস্থা প্রতিদিন সরকারি ওয়েবসাইট দেখে নতুন নোটিশ যোগ করে।", "Notices from the union, upazila and district offices and Katuli Union tenders — newest first. Our automatic checker adds new ones from government websites every day.")}</p>
      <div className="chips" role="group" aria-label={t("ধরন", "Type")}>
        {(["all", "document", "tender"] as const).map((k) => (
          <button key={k} type="button" className={`chip chip-btn${kind === k ? " active" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k === "all" ? t("সব", "All") : k === "document" ? t("নোটিশ ও কাগজ", "Notices") : t("টেন্ডার", "Tenders")}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="muted">{t("এখনো কিছু নেই।", "Nothing yet.")}</p> : <ul className="notices">{shown.map((x) => <NoticeRow key={x.id} x={x} />)}</ul>}
    </>
  );
}
