import { ChevronRight, FolderOpen, Gavel, Hammer, HandHeart, MapPin, Receipt, Scale, Wallet } from "lucide-react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

export const SECTIONS = [
  { to: "/budget", icon: Wallet, bn: "আয়-ব্যয়ের হিসাব", en: "Income & spending", dbn: "ইউনিয়ন কত টাকা পায়, কোথায় খরচ করে", den: "How much the union gets and where it goes" },
  { to: "/projects", icon: Hammer, bn: "উন্নয়ন কাজ", en: "Development works", dbn: "কোথায় রাস্তা, মসজিদ, স্কুলের কাজ — কত টাকার", den: "Roads, mosques, schools — where and for how much" },
  { to: "/wards", icon: MapPin, bn: "আমার ওয়ার্ড", en: "My ward", dbn: "আপনার এলাকার কাজ ও ভাতার তথ্য", den: "Works and allowances in your area" },
  { to: "/allowances", icon: HandHeart, bn: "ভাতা ও সহায়তা", en: "Allowances", dbn: "বয়স্ক, বিধবা, প্রতিবন্ধী ভাতা — কে পাবেন, কত টাকা", den: "Old-age, widow, disability — who gets it, how much" },
  { to: "/services", icon: Receipt, bn: "সেবার সরকারি ফি", en: "Official fees", dbn: "জন্ম নিবন্ধন, সনদে কত টাকা লাগার কথা", den: "What certificates should cost" },
  { to: "/tenders", icon: Gavel, bn: "টেন্ডার (দরপত্র)", en: "Tenders", dbn: "এলাকার কোন কাজে ঠিকাদার নেওয়া হচ্ছে", den: "Which local works are being contracted out" },
  { to: "/rights", icon: Scale, bn: "আপনার অধিকার", en: "Your rights", dbn: "তথ্য চাওয়া, সভায় যাওয়া, অভিযোগ করার নিয়ম", den: "Asking for information, meetings, complaints" },
  { to: "/documents", icon: FolderOpen, bn: "মূল কাগজপত্র", en: "Original documents", dbn: "সব হিসাবের সরকারি নথির কপি", den: "Copies of every source document" },
];

export function SectionTiles() {
  const t = useT();
  return (
    <nav className="menu" aria-label={t("বিভাগসমূহ", "Sections")}>
      {SECTIONS.map((x) => (
        <Link key={x.to} to={x.to} className="menu-item">
          <span className="menu-icon"><x.icon size={24} aria-hidden /></span>
          <span className="grow"><strong>{t(x.bn, x.en)}</strong><span className="muted">{t(x.dbn, x.den)}</span></span>
          <ChevronRight size={20} aria-hidden className="menu-chevron" />
        </Link>
      ))}
    </nav>
  );
}
