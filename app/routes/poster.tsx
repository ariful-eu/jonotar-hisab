import QRCode from "qrcode";
import { data, useLoaderData } from "react-router";
import type { Route } from "./+types/poster";
import { loadDataset } from "../data/load.server";
import { headlineYear, summarizeYear } from "../lib/aggregate";
import { formatFy, formatTaka, formatTakaFull, perHousehold, toBnDigits } from "../lib/format";
import { useT } from "../lib/i18n";
import { SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";
import { absoluteUrl } from "../lib/site";

export function meta() {
  return pageMeta("প্রিন্টযোগ্য পোস্টার", "নোটিশ বোর্ড, হাট-বাজার ও মসজিদে লাগানোর জন্য পোস্টার।");
}

type Poster = { title: string; big: string | null; bigLabel: string | null; facts: { label: string; value: string }[]; path: string };

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const id = ds.union.id;
  let poster: Poster;
  if (params.kind === "home" && params.id === id) {
    const fy = headlineYear(ds.budget, id).year;
    const s = fy ? summarizeYear(ds.budget, ds.reportedTotals, id, fy) : null;
    const income = s ? s.reportedIncome ?? s.income : null;
    const perHh = income !== null ? perHousehold(income, ds.union.households) : null;
    const published = ds.disclosures.filter((d) => d.published === "yes").length;
    poster = {
      title: "কাতুলী ইউনিয়নের টাকা কোথা থেকে আসে, কোথায় যায়?",
      big: income !== null ? formatTaka(income, "bn") : null,
      bigLabel: s ? `${formatFy(s.fiscalYear, "bn")} অর্থবছরের আয় (ইউনিয়নের সর্বশেষ প্রকাশিত বাজেট)${perHh !== null ? ` — প্রতি পরিবারে প্রায় ${formatTakaFull(perHh, "bn")}` : ""}` : null,
      facts: [
        { label: "এর পরের বাজেট", value: "প্রকাশিত হয়নি — চেয়ে নিন (তথ্য অধিকার আইন)" },
        { label: "আইন অনুযায়ী প্রকাশযোগ্য নথি", value: `${toBnDigits(ds.disclosures.length)}টির মধ্যে ${toBnDigits(published)}টি প্রকাশিত` },
        { label: "তথ্য চাওয়ার অধিকার", value: "তথ্য অধিকার আইন ২০০৯ — ২০ কার্যদিবসে উত্তর দেওয়ার কথা" },
        { label: "ঘুষ চাইলে", value: "দুদক হটলাইন ১০৬ (টোল-ফ্রি)" },
      ],
      path: "/",
    };
  } else if (params.kind === "ward") {
    const ward = ds.union.wards.find((w) => String(w.no) === params.id);
    if (!ward) throw data(null, { status: 404 });
    const projects = ds.projects.filter((p) => p.ward === ward.no);
    poster = {
      title: `কাতুলী ইউনিয়ন — ${toBnDigits(ward.no)} নং ওয়ার্ড`,
      big: null,
      bigLabel: null,
      facts: [
        ...projects.slice(0, 6).map((p) => ({ label: p.name_bn, value: p.amount !== null ? formatTakaFull(p.amount, "bn") : "টাকার পরিমাণ অজানা" })),
        ...(projects.length === 0 ? [{ label: "এই ওয়ার্ডের প্রকল্প", value: "কোনো তথ্য প্রকাশিত হয়নি" }] : []),
        { label: "ওয়ার্ড সভা", value: "বছরে অন্তত ২ বার, ৭ দিন আগে নোটিশ — সব ভোটার সদস্য" },
      ],
      path: `/ward/${ward.no}`,
    };
  } else if (params.kind === "project") {
    const p = ds.projects.find((x) => x.id === params.id);
    if (!p) throw data(null, { status: 404 });
    poster = {
      title: p.name_bn,
      big: p.amount !== null ? formatTakaFull(p.amount, "bn") : null,
      bigLabel: p.amount !== null ? "বরাদ্দ" : null,
      facts: [
        { label: "কর্মসূচি", value: SCHEME_LABEL[p.scheme].bn },
        { label: "ওয়ার্ড", value: p.ward ? toBnDigits(p.ward) : "অজানা" },
        { label: "বাস্তবায়নকারী", value: p.implementer_bn ?? "অজানা" },
        { label: "কাজের পরিমাণ", value: p.unit_of_work_bn ?? "অজানা" },
      ],
      path: `/projects/${p.id}`,
    };
  } else {
    throw data(null, { status: 404 });
  }
  const url = absoluteUrl(poster.path);
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { poster, qr, url };
}

export default function PosterPage() {
  const { poster, qr, url } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <p className="no-print">{t("এই পাতাটি A4 কাগজে প্রিন্ট করে নোটিশ বোর্ড, হাট-বাজার, মসজিদ বা স্কুলে লাগান।", "Print this page on A4 and put it up on notice boards, markets, mosques or schools.")}</p>
      <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>{t("প্রিন্ট করুন", "Print")}</button>
      <article className="poster" lang="bn">
        <h1>{poster.title}</h1>
        {poster.big ? <p className="big">{poster.big}</p> : null}
        {poster.bigLabel ? <p>{poster.bigLabel}</p> : null}
        <table className="lines"><tbody>{poster.facts.map((f) => <tr key={f.label}><td>{f.label}</td><td><strong>{f.value}</strong></td></tr>)}</tbody></table>
        <div className="qr">
          <span dangerouslySetInnerHTML={{ __html: qr }} />
          <p>ফোনের ক্যামেরা দিয়ে স্ক্যান করে বিস্তারিত দেখুন<br /><small>{url}</small></p>
        </div>
        <p className="muted">জনতার হিসাব — স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি নোটিশ নয়। কোনো অমিল মানেই অনিয়মের প্রমাণ নয়।</p>
      </article>
    </>
  );
}
