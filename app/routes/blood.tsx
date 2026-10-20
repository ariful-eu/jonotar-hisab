import { AlertTriangle, Droplet, ExternalLink, HandHeart, Phone, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Link, useLoaderData } from "react-router";
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
  return pageMeta("রক্তদান — রক্ত দিন, রক্ত খুঁজুন", "কাতুলী ইউনিয়নে কোন গ্রুপের রক্তদাতা আছেন, কে রক্ত দিতে পারেন, কোন গ্রুপ কাকে দিতে পারে, আর রক্ত লাগলে টাঙ্গাইলে কোথায় যাবেন।");
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

export default function Blood() {
  const { hospital, blood, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const live = blood.groups_csv_url !== null || blood.donor_form_url !== null || blood.request_form_url !== null;
  return (
    <>
      <h1 className="guide-title"><span className="menu-icon blood-icon"><Droplet size={26} aria-hidden /></span>{t("রক্তদান", "Blood donation")}</h1>
      <p className="intro">{t(
        "রক্ত লাগলে কোথায় যাবেন, কে রক্ত দিতে পারেন, কোন গ্রুপ কাকে দিতে পারে — আর কাতুলী ইউনিয়নের রক্তদাতাদের সাথে যোগাযোগ।",
        "Where to go when you need blood, who can donate, which group can give to whom — and connecting with blood donors in Katuli Union.",
      )}</p>

      <section className="card guide-section blood-urgent">
        <h2 className="h3"><Phone size={20} aria-hidden /> {t("জরুরি রক্ত লাগলে", "If you need blood urgently")}</h2>
        <p>{t(
          "টাঙ্গাইল জেনারেল হাসপাতালে রক্ত পরিসঞ্চালন বিভাগ আছে, যা সার্বক্ষণিক খোলা থাকে। রোগীর ডাক্তারের দেওয়া রক্তের চাহিদাপত্র নিয়ে যান।",
          "Tangail General Hospital has a blood transfusion department that is open round the clock. Take the requisition slip from the patient's doctor.",
        )}</p>
        <ul className="contact-list">
          {hospital.map((c) => (
            <li key={c.id} className="contact">
              <span className="grow"><strong>{f.lang === "bn" ? c.name_bn : c.name_en}</strong>{c.note_bn ? <span className="muted">{c.note_bn}</span> : null}</span>
              <a className="call-btn" href={telHref(c.number)} aria-label={t(`${c.name_bn} — ${c.number} নম্বরে কল করুন`, `Call ${c.name_en}`)}>
                <Phone size={18} aria-hidden /><span>{f.lang === "bn" ? c.number : c.number.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="muted">{t("হাসপাতালের রক্ত বিভাগের আলাদা নম্বর সরকারি ওয়েবসাইটে পাওয়া যায়নি — তাই জরুরি বিভাগের নম্বর দেওয়া হলো।", "The blood department's own number isn't on any official website, so the emergency department numbers are given.")}</p>
      </section>

      {live ? (
        <section className="card guide-section">
          <h2 className="h3"><Users size={20} aria-hidden /> {t("কাতুলী ইউনিয়নে এখন যে গ্রুপের রক্তদাতা আছেন", "Blood groups with donors in Katuli Union now")}</h2>
          {blood.groups_csv_url ? <BloodAvailability csvUrl={blood.groups_csv_url} /> : null}
          {blood.request_form_url ? (
            <div className="blood-action">
              <p>{t(
                "রক্ত লাগলে অনুরোধ পাঠান। আমরা মিলে যাওয়া রক্তদাতার সাথে যোগাযোগ করে আপনাকে ফোনে জানাব। আপনার নম্বর শুধু এই কাজেই ব্যবহার হবে, কোথাও দেখানো হবে না।",
                "Send a request if you need blood. We'll contact a matching donor and call you back. Your number is used only for this and never shown anywhere.",
              )}</p>
              <a className="btn btn-blood" href={blood.request_form_url} target="_blank" rel="noopener"><Droplet size={18} aria-hidden /> {t("রক্তের অনুরোধ করুন", "Request blood")} <ExternalLink size={16} aria-hidden /></a>
              <p className="muted">{t("অনুরোধ স্বেচ্ছাসেবকেরা দেখেন — উত্তর পেতে সময় লাগতে পারে। খুব জরুরি হলে সাথে সাথে ওপরের হাসপাতালে কল করুন।", "Volunteers check requests — a reply can take time. If it's very urgent, call the hospital above straight away.")}</p>
            </div>
          ) : null}
          {blood.donor_form_url ? (
            <div className="blood-action">
              <p>{t(
                "রক্ত দিতে চাইলে নাম লেখান: নাম, ফোন নম্বর, এলাকা আর রক্তের গ্রুপ — এটুকুই। আপনার নাম ও নম্বর গোপন থাকবে; শুধু রক্তের দরকার হলে আমরা আপনাকে ফোন করে জিজ্ঞেস করব। রাজি না থাকলে না বলতে পারেন।",
                "Want to donate? Sign up with your name, phone, area and blood group — that's all. Your name and number stay private; we only call to ask when blood is needed, and you can always say no.",
              )}</p>
              <a className="btn btn-primary" href={blood.donor_form_url} target="_blank" rel="noopener"><HandHeart size={18} aria-hidden /> {t("রক্তদাতা হোন", "Become a donor")} <ExternalLink size={16} aria-hidden /></a>
              {blood.remove_form_url ? <p className="muted"><a href={blood.remove_form_url} target="_blank" rel="noopener">{t("তালিকা থেকে নাম সরাতে চাইলে এখানে জানান", "Ask to be removed from the list")}</a>{t(" — ৭ দিনের মধ্যে সরিয়ে দেওয়া হবে।", " — done within 7 days.")}</p> : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card guide-section">
          <h2 className="h3"><Users size={20} aria-hidden /> {t("রক্তদাতাদের তালিকা", "Donor list")}</h2>
          <p>{t("কাতুলী ইউনিয়নের রক্তদাতাদের তালিকা শিগগিরই চালু হবে — তখন এখানে নাম লেখাতে আর রক্তের অনুরোধ পাঠাতে পারবেন।", "A donor list for Katuli Union is coming soon — you'll be able to sign up and send blood requests here.")}</p>
        </section>
      )}

      <section className="card guide-section blood-warn">
        <h2 className="h3"><AlertTriangle size={20} aria-hidden /> {t("সাবধান", "Be careful")}</h2>
        <ul>
          <li>{t("রক্তের জন্য কাউকে টাকা দেবেন না। রক্তদাতা বা \"দালাল\" টাকা চাইলে বুঝবেন কিছু ঠিক নেই — হাসপাতালের রক্ত বিভাগে যোগাযোগ করুন।", "Don't pay anyone for blood. If a donor or a \"middleman\" asks for money, something is wrong — contact the hospital's blood department.")}</li>
          <li>{t("আইন অনুযায়ী এইডস, হেপাটাইটিস বি ও সি, সিফিলিস আর ম্যালেরিয়া পরীক্ষা না করা রক্ত কোনো রোগীর শরীরে দেওয়া যায় না। পরীক্ষা হয়েছে কি না জিজ্ঞেস করুন।", "By law, blood not tested for HIV, hepatitis B and C, syphilis and malaria must not be given to any patient. Ask whether it has been tested.")}</li>
          <li>{t("হাসপাতাল কোনো পরীক্ষার ফি নিলে রসিদ চেয়ে নিন।", "If the hospital charges for tests, ask for a receipt.")}</li>
        </ul>
      </section>

      <section className="card guide-section">
        <h2 className="h3"><UserCheck size={20} aria-hidden /> {t("কে রক্ত দিতে পারেন", "Who can give blood")}</h2>
        <p>{t("বিশ্ব স্বাস্থ্য সংস্থার সাধারণ নিয়ম অনুযায়ী:", "According to the World Health Organization's general guidance:")}</p>
        <ul className="checklist">
          <li>{t("বয়স ১৮ থেকে ৬৫ বছর (কোনো কোনো দেশে ঊর্ধ্বসীমা ৬০)", "Aged 18 to 65 (60 in some countries)")}</li>
          <li>{t("ওজন অন্তত ৫০ কেজি (কোনো কোনো দেশে ৪৫ কেজি হলে কম পরিমাণ রক্ত নেওয়া হয়)", "Weigh at least 50 kg (some countries take a smaller donation at 45 kg)")}</li>
          <li>{t("রক্ত দেওয়ার দিন সুস্থ থাকতে হবে", "In good health on the day")}</li>
        </ul>
        <h3>{t("কিছুদিন অপেক্ষা করুন যদি…", "Wait a while if…")}</h3>
        <ul>
          <li>{t("সর্দি, জ্বর, গলাব্যথা, পেটের অসুখ বা অন্য কোনো সংক্রমণ থাকে", "You have a cold, fever, sore throat, stomach bug or any other infection")}</li>
          <li>{t("গর্ভবতী হন বা সম্প্রতি সন্তান জন্ম দিয়েছেন, বা বুকের দুধ খাওয়াচ্ছেন", "You are pregnant, recently gave birth, or are breastfeeding")}</li>
          <li>{t("গত ৬ মাসে ট্যাটু করিয়েছেন, বা সম্প্রতি দাঁতের চিকিৎসা হয়েছে", "You had a tattoo in the last 6 months, or recent dental treatment")}</li>
        </ul>
        <p className="muted">{t("কত দিন পর পর রক্ত দেওয়া যাবে, আর আপনি আজ দিতে পারবেন কি না — রক্ত নেওয়ার আগে হাসপাতালের ডাক্তার পরীক্ষা করে বলে দেবেন।", "How often you can donate, and whether you can today, is decided by the hospital doctor who checks you before taking blood.")}</p>
      </section>

      <section className="card guide-section">
        <h2 className="h3"><ShieldCheck size={20} aria-hidden /> {t("কোন গ্রুপ কাকে রক্ত দিতে পারে", "Which group can give to whom")}</h2>
        <CompatibilityPicker />
      </section>

      <p className="muted">
        {t("জনতার খাতা রক্ত সংগ্রহ বা পরীক্ষা করে না — আমরা শুধু মানুষের সাথে মানুষের যোগাযোগ করিয়ে দিই। ", "Jonotar Khata does not collect or test blood — we only help people find each other. ")}
        {t("তথ্যের উৎস: ", "Sources: ")}
        {docs.map((d, i) => {
          const href = docHref(d);
          const label = f.lang === "en" && d.title_en ? d.title_en : d.title_bn;
          return <span key={d.id}>{i > 0 ? " · " : ""}{href ? <a href={href} target="_blank" rel="noopener">{label}</a> : label}</span>;
        })}
      </p>
      <p><Link to="/contacts">{t("আরও দরকারি নম্বর →", "More useful numbers →")}</Link></p>

      <ShareButtons title={t("রক্তদান — কাতুলী ইউনিয়ন", "Blood donation — Katuli Union")} />
    </>
  );
}
