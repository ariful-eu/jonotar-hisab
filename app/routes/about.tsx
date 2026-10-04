import { BadgeCheck, Bell, Handshake, Map, ShieldCheck } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

const ROADMAP_URL = "https://github.com/ariful-eu/jonotar-hisab/blob/main/docs/product-roadmap.md";

export function meta() {
  return pageMeta("আমাদের সম্পর্কে — জনতার হিসাব", "জনতার হিসাব একটি স্বাধীন নাগরিক তথ্যসেবা: সরকারি সেবা, ভাতা, দরকারি নম্বর ও ইউনিয়নের তথ্য সহজ ভাষায়, এক জায়গায়।");
}

export async function loader() {
  const ds = loadDataset();
  return { portal: ds.union.portal_url, whatsapp: ds.union.maintainer.whatsapp, note: ds.union.maintainer.note_bn };
}

export default function About() {
  const { portal, whatsapp, note } = useLoaderData<typeof loader>();
  const t = useT();
  const promises = [
    { icon: BadgeCheck, bn: "সহজ ভাষা", en: "Plain language", dbn: "সরকারি নিয়ম-কানুন সাধারণ মানুষের বোঝার মতো করে লেখা।", den: "Government rules written so anyone can follow them." },
    { icon: ShieldCheck, bn: "উৎসসহ তথ্য", en: "Sourced information", dbn: "প্রতিটি সংখ্যা ও নিয়মের সরকারি উৎস দেওয়া থাকে, কপিও সংরক্ষিত।", den: "Every figure and rule links to an official source, with a saved copy." },
    { icon: Bell, bn: "নিয়মিত হালনাগাদ", en: "Kept up to date", dbn: "প্রতিদিন সরকারি ওয়েবসাইট দেখে নতুন নোটিশ ও টেন্ডার যোগ হয়।", den: "New notices and tenders are added daily from government websites." },
    { icon: Handshake, bn: "সবার জন্য, বিনামূল্যে", en: "Free, for everyone", dbn: "কোনো লগইন বা টাকা লাগে না; আপনার তথ্য আপনার ফোনেই থাকে।", den: "No login or payment; your details stay on your phone." },
  ];
  return (
    <>
      <h1>{t("আমাদের সম্পর্কে", "About us")}</h1>
      <p className="intro">{t(
        "“জনতার হিসাব” একটি স্বাধীন নাগরিক তথ্যসেবা। আমাদের লক্ষ্য: কাতুলী ইউনিয়নের প্রত্যেক মানুষ যেন সরকারি সেবা, ভাতা, দরকারি নম্বর আর নিজের ইউনিয়নের কাজ ও বাজেটের তথ্য সহজে, এক জায়গায় পান।",
        "“Jonotar Hisab” is an independent citizen information service. Our aim: that everyone in Katuli Union can easily find government services, allowances, useful numbers, and their union's work and budget — all in one place.",
      )}</p>

      <div className="promise-grid">
        {promises.map((p) => (
          <section key={p.en} className="card promise">
            <p.icon size={26} aria-hidden />
            <h2 className="h3">{t(p.bn, p.en)}</h2>
            <p className="muted">{t(p.dbn, p.den)}</p>
          </section>
        ))}
      </div>

      <section className="card">
        <h2 className="h3">{t("তথ্য কোথা থেকে আসে", "Where the information comes from")}</h2>
        <ul>
          <li><span className="chip chip-union">{t("ইউনিয়নের নিজের কাগজ", "Union's own document")}</span> {t("ইউনিয়ন পরিষদের ওয়েবসাইট ও নোটিশ বোর্ডের বাজেট, নোটিশ ও তালিকা।", "Budgets, notices and lists from the Union Parishad's website and notice board.")}</li>
          <li><span className="chip chip-upstream">{t("অন্য সরকারি অফিসের কাগজ", "Other government office")}</span> {t("উপজেলা, জেলা, এলজিইডি ও মন্ত্রণালয়ের ওয়েবসাইটের তথ্য।", "Information from upazila, district, LGED and ministry websites.")}</li>
          <li><span className="chip chip-observed">{t("স্বেচ্ছাসেবকের পর্যবেক্ষণ", "Volunteer observation")}</span> {t("এলাকার স্বেচ্ছাসেবকেরা নিজে গিয়ে যা দেখেছেন, তারিখ ও ছবিসহ।", "What local volunteers saw in person, with date and photos.")}</li>
        </ul>
        <p className="muted">{t("এটি সরকারি ওয়েবসাইট নয় এবং কোনো দল বা দপ্তরের সাথে যুক্ত নয়। কোনো তথ্যে অমিল থাকলে তা প্রশ্ন করার কারণ, কারো বিরুদ্ধে অভিযোগ নয়। ভুল চোখে পড়লে জানান — প্রমাণসহ ঠিক করে দেব। ইউনিয়ন পরিষদ কোনো তথ্য সংশোধন করতে চাইলে তাদের বক্তব্য হুবহু প্রকাশ করা হবে।", "This is not a government website and is not linked to any party or office. A mismatch in the data is a reason to ask, not an accusation. Spot a mistake? Tell us and we'll correct it with evidence. If the Union Parishad wants to correct anything, we'll publish its response in full.")}</p>
        <p>{t("ইউনিয়ন পরিষদের সরকারি ওয়েবসাইট: ", "The Union Parishad's official website: ")}<a href={portal} target="_blank" rel="noopener">{portal}</a></p>
      </section>

      <section className="card">
        <h2 className="h3">{t("সাথে থাকুন, সাহায্য করুন", "Stay in touch, lend a hand")}</h2>
        <ul>
          <li>{t("আপনার কাছে কোনো নোটিশ, বাজেট বা তালিকার কপি থাকলে আমাদের দিন — সবাই উপকৃত হবেন।", "Have a copy of a notice, budget or list? Share it — everyone benefits.")}</li>
          <li>{t("এলাকার কোনো কাজ শুরু বা শেষ হতে দেখলে ছবি পাঠান।", "Seen a local work start or finish? Send a photo.")}</li>
          <li>{t("পরিবার ও প্রতিবেশীকে সাইটটির কথা বলুন, পোস্টার প্রিন্ট করে নোটিশ বোর্ডে লাগান।", "Tell family and neighbours, or print a poster for a notice board.")}</li>
        </ul>
        <div className="share">
          {whatsapp ? <a className="btn btn-primary" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">{t("হোয়াটসঅ্যাপে যোগাযোগ", "Contact on WhatsApp")}</a> : null}
          <Link className="btn" to="/poster/home/katuli">{t("পোস্টার প্রিন্ট করুন", "Print a poster")}</Link>
        </div>
        {note ? <p>{note}</p> : null}
      </section>

      <section className="card">
        <h2 className="h3"><Map size={20} aria-hidden /> {t("সামনে যা আসছে", "What's coming next")}</h2>
        <p>{t("নিজের ওয়ার্ডের নতুন নোটিশ ফোনে পাওয়া, স্বেচ্ছাসেবকদের ছবি পাঠানোর সহজ ব্যবস্থা, আর আশেপাশের অন্য ইউনিয়নেও একই সেবা।", "Getting your ward's new notices on your phone, an easy way for volunteers to send photos, and the same service for neighbouring unions.")}</p>
        <a href={ROADMAP_URL} target="_blank" rel="noopener">{t("পরিকল্পনা বিস্তারিত দেখুন →", "See the roadmap →")}</a>
      </section>
    </>
  );
}
