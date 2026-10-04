import { Phone } from "lucide-react";
import { useLoaderData } from "react-router";
import { docHref } from "../components/SourceBadge";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { CONTACT_CATEGORIES } from "../data/schemas";
import { telHref } from "../lib/contacts";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("দরকারি নম্বর — জরুরি সেবা, হাসপাতাল, হেল্পলাইন", "৯৯৯, স্বাস্থ্য বাতায়ন, নারী ও শিশু সহায়তা, আইনি সহায়তা, ভূমি সেবা, টাঙ্গাইলের হাসপাতাল ও উপজেলা অফিস — এক চাপে কল করুন।");
}

export async function loader() {
  const ds = loadDataset();
  return { contacts: ds.contacts, docs: docRefs(ds.documents, ds.contacts.map((c) => c.source_doc)) };
}

const CATEGORY_LABEL: Record<(typeof CONTACT_CATEGORIES)[number], { bn: string; en: string }> = {
  emergency: { bn: "জরুরি", en: "Emergency" },
  health: { bn: "স্বাস্থ্য ও হাসপাতাল", en: "Health & hospitals" },
  women_children: { bn: "নারী ও শিশু", en: "Women & children" },
  legal: { bn: "আইনি সহায়তা", en: "Legal help" },
  agriculture: { bn: "কৃষি", en: "Agriculture" },
  govt_info: { bn: "সরকারি তথ্য ও সেবা", en: "Government information & services" },
  utility: { bn: "বিদ্যুৎ ও টেলিফোন", en: "Electricity & telecom" },
  local_office: { bn: "স্থানীয় অফিস", en: "Local offices" },
};

export default function Contacts() {
  const { contacts, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  return (
    <>
      <h1>{t("দরকারি নম্বর", "Useful numbers")}</h1>
      <p className="intro">{t("নম্বরে চাপ দিলেই ফোন হবে। সব নম্বর সরকারি ওয়েবসাইট থেকে নেওয়া — প্রতিটির পাশে উৎস আছে।", "Tap a number to call. Every number comes from an official government website, with its source.")}</p>
      {CONTACT_CATEGORIES.map((cat) => {
        const items = contacts.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`} className="h3">{CATEGORY_LABEL[cat][f.lang]}</h2>
            <ul className="contact-list">
              {items.map((c) => {
                const doc = docs[c.source_doc];
                const href = doc ? docHref(doc) : null;
                return (
                  <li key={c.id} className={`card contact${cat === "emergency" ? " contact-emergency" : ""}`}>
                    <span className="grow">
                      <strong>{f.lang === "bn" ? c.name_bn : c.name_en}</strong>
                      {c.note_bn ? <span className="muted">{c.note_bn}</span> : null}
                      <span className="chips">
                        {c.hours_bn ? <span className="chip">{c.hours_bn}</span> : null}
                        {c.free === "yes" ? <span className="chip chip-union">{t("বিনামূল্যে", "Free")}</span> : c.free === "no" ? <span className="chip">{t("সাধারণ কল চার্জ", "Normal call charge")}</span> : null}
                        {href ? <a className="small-link" href={href} target="_blank" rel="noopener">{t("উৎস", "Source")}</a> : null}
                      </span>
                    </span>
                    <a className="call-btn" href={telHref(c.number)} aria-label={t(`${c.name_bn} — ${c.number} নম্বরে কল করুন`, `Call ${c.name_en} on ${c.number}`)}>
                      <Phone size={18} aria-hidden />
                      <span>{f.lang === "bn" ? c.number : c.number.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="muted">{t("কাতুলী ইউনিয়ন পরিষদ ও কমিউনিটি ক্লিনিকের নম্বর সরকারি ওয়েবসাইটে পাওয়া যায়নি — যাচাই করা নম্বর পেলে এখানে যোগ হবে।", "Katuli Union Parishad and community clinic numbers weren't found on official websites — they'll be added once verified.")}</p>
    </>
  );
}
