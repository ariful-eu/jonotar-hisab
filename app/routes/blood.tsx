import { AlertTriangle, ChevronDown, Droplet, HandHeart, Phone, ShieldCheck, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useLoaderData } from "react-router";
import { BloodAvailability, CompatibilityPicker } from "../components/BloodGroups";
import { ShareButtons } from "../components/ShareButtons";
import { docHref } from "../components/SourceBadge";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { telHref } from "../lib/contacts";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

const HOSPITAL_CONTACTS = ["tangail-general-hospital", "tangail-general-hospital-mobile"];
const SOURCES = ["tsadar-hospitals", "blood-act-2002", "who-can-give-blood"];

export function meta() {
  return pageMeta("রক্তদান — রক্ত দিন, রক্ত খুঁজুন", "কাতুলী ইউনিয়নে কোন গ্রুপের রক্তদাতা আছেন, রক্ত লাগলে কোথায় যাবেন, কে রক্ত দিতে পারেন।");
}

export async function loader() {
  const ds = loadDataset();
  const blood = ds.union.blood ?? { donor_form_url: null, request_form_url: null, groups_csv_url: null, remove_form_url: null };
  return {
    hospital: HOSPITAL_CONTACTS.map((id) => ds.contacts.find((c) => c.id === id)).filter((c) => c !== undefined),
    blood,
    docs: Object.values(docRefs(ds.documents, SOURCES)),
  };
}

function More({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <details className="card blood-more">
      <summary>{icon}<span className="grow">{title}</span><ChevronDown size={20} aria-hidden className="blood-more-chevron" /></summary>
      <div className="blood-more-body">{children}</div>
    </details>
  );
}

export default function Blood() {
  const { hospital, blood, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const latin = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  return (
    <>
      <h1 className="guide-title"><span className="menu-icon blood-icon"><Droplet size={26} aria-hidden /></span>{t("রক্তদান", "Blood donation")}</h1>
      <p className="intro">{t("রক্ত লাগলে বা রক্ত দিতে চাইলে — কাতুলী ইউনিয়ন।", "Need blood or want to give — Katuli Union.")}</p>

      {blood.request_form_url || blood.donor_form_url ? (
        <div className="blood-actions">
          {blood.request_form_url ? (
            <a className="btn btn-blood" href={blood.request_form_url} target="_blank" rel="noopener"><Droplet size={18} aria-hidden /> {t("রক্ত লাগবে", "I need blood")}</a>
          ) : null}
          {blood.donor_form_url ? (
            <a className="btn btn-primary" href={blood.donor_form_url} target="_blank" rel="noopener"><HandHeart size={18} aria-hidden /> {t("রক্ত দিতে চাই", "I want to donate")}</a>
          ) : null}
        </div>
      ) : null}
      {blood.request_form_url || blood.donor_form_url ? (
        <p className="muted small">{t("আপনার নাম-নম্বর গোপন থাকবে। অনুরোধ পেলে আমরা মিলে যাওয়া রক্তদাতার খোঁজ দেব।", "Your details stay private. On request, we'll connect you with a matching donor.")}</p>
      ) : null}

      <section className="card blood-card">
        <h2 className="h3">{t("যে গ্রুপের রক্তদাতা আছেন", "Donor groups available")}</h2>
        {blood.groups_csv_url ? <BloodAvailability csvUrl={blood.groups_csv_url} /> : <p className="muted">{t("রক্তদাতার তালিকা শিগগিরই চালু হবে।", "The donor list is coming soon.")}</p>}
      </section>

      <section className="card blood-card blood-urgent">
        <h2 className="h3"><Phone size={20} aria-hidden /> {t("জরুরি হলে", "Urgent?")}</h2>
        <p className="muted small">{t("টাঙ্গাইল জেনারেল হাসপাতাল — রক্ত বিভাগ ২৪ ঘণ্টা খোলা", "Tangail General Hospital — blood department open 24 hours")}</p>
        <div className="blood-calls">
          {hospital.map((c) => (
            <a key={c.id} className="call-btn" href={telHref(c.number)} aria-label={t(`${c.name_bn} — ${c.number} নম্বরে কল করুন`, `Call ${c.name_en}`)}>
              <Phone size={18} aria-hidden /><span>{f.lang === "bn" ? c.number : latin(c.number)}</span>
            </a>
          ))}
        </div>
      </section>

      <More icon={<AlertTriangle size={20} aria-hidden />} title={t("সাবধান", "Be careful")}>
        <ul>
          <li>{t("রক্তের জন্য কাউকে টাকা দেবেন না।", "Never pay anyone for blood.")}</li>
          <li>{t("পরীক্ষা ছাড়া রক্ত নেওয়া আইনত নিষেধ — পরীক্ষা হয়েছে কি না জিজ্ঞেস করুন।", "Untested blood is illegal — ask whether it was tested.")}</li>
        </ul>
      </More>

      <More icon={<UserCheck size={20} aria-hidden />} title={t("কে রক্ত দিতে পারেন", "Who can give blood")}>
        <ul className="checklist">
          <li>{t("বয়স ১৮–৬৫", "Age 18–65")}</li>
          <li>{t("ওজন ৫০ কেজি বা বেশি", "Weight 50 kg or more")}</li>
          <li>{t("সেদিন সুস্থ — জ্বর, সর্দি বা সংক্রমণ নেই", "Healthy that day — no fever, cold or infection")}</li>
          <li>{t("গর্ভবতী বা দুধ খাওয়ানো মা নন", "Not pregnant or breastfeeding")}</li>
        </ul>
        <p className="muted small">{t("চূড়ান্ত সিদ্ধান্ত হাসপাতালের ডাক্তারের।", "The hospital doctor decides.")}</p>
      </More>

      <More icon={<ShieldCheck size={20} aria-hidden />} title={t("কোন গ্রুপ কাকে দিতে পারে", "Which group can give to whom")}>
        <CompatibilityPicker />
      </More>

      <p className="muted small">
        {t("উৎস: ", "Sources: ")}
        {docs.map((d, i) => {
          const href = docHref(d);
          const label = f.lang === "en" && d.title_en ? d.title_en : d.title_bn;
          return <span key={d.id}>{i > 0 ? " · " : ""}{href ? <a href={href} target="_blank" rel="noopener">{label}</a> : label}</span>;
        })}
      </p>

      <ShareButtons title={t("রক্তদান — কাতুলী ইউনিয়ন", "Blood donation — Katuli Union")} />
    </>
  );
}
