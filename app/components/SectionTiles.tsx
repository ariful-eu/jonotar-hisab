import { BadgeCheck, Bell, ChevronRight, ClipboardList, FolderOpen, Gavel, Hammer, HandHeart, Info, MapPin, PhoneCall, Scale, Wallet } from "lucide-react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

type Section = { to: string; icon: typeof Wallet; bn: string; en: string; dbn: string; den: string; tone?: "teal" | "amber" | "clay" };

export const QUICK_ACTIONS: Section[] = [
  { to: "/services", icon: ClipboardList, bn: "সেবা পাবেন কীভাবে", en: "How to get services", dbn: "জন্ম নিবন্ধন, সনদ, ট্রেড লাইসেন্স, জমি — কী লাগবে, কত টাকা", den: "Birth registration, certificates, licences, land — papers and fees", tone: "teal" },
  { to: "/allowances/check", icon: BadgeCheck, bn: "ভাতা যাচাই", en: "Check allowances", dbn: "কয়েকটি প্রশ্নে জানুন কোন ভাতা পেতে পারেন", den: "A few questions to see which allowances you may get", tone: "amber" },
  { to: "/contacts", icon: PhoneCall, bn: "দরকারি নম্বর", en: "Useful numbers", dbn: "জরুরি সেবা, হাসপাতাল, হেল্পলাইন — এক চাপে কল", den: "Emergency, health and helplines — tap to call", tone: "clay" },
  { to: "/wards", icon: MapPin, bn: "আপনার এলাকা", en: "Your area", dbn: "আপনার ওয়ার্ডের কাজ, ভাতা ও ওয়ার্ড সভা", den: "Works, allowances and meetings in your ward" },
  { to: "/notices", icon: Bell, bn: "নোটিশ ও খবর", en: "Notices & news", dbn: "ইউনিয়ন, উপজেলা ও জেলার নতুন নোটিশ", den: "New notices from union, upazila and district" },
  { to: "/budget", icon: Wallet, bn: "ইউনিয়নের বাজেট", en: "Union budget", dbn: "ইউনিয়নের টাকা কোথা থেকে আসে, কোথায় খরচ হয়", den: "Where the union's money comes from and goes" },
];

export const MORE_SECTIONS: Section[] = [
  { to: "/allowances", icon: HandHeart, bn: "ভাতা ও সহায়তা", en: "Allowances", dbn: "সব ভাতার হার, শর্ত ও বাছাইয়ের নিয়ম", den: "Rates, conditions and selection" },
  { to: "/projects", icon: Hammer, bn: "উন্নয়ন কাজ", en: "Development works", dbn: "কোথায় কী কাজ হচ্ছে, কত টাকার", den: "What's being built and for how much" },
  { to: "/tenders", icon: Gavel, bn: "টেন্ডার (দরপত্র)", en: "Tenders", dbn: "এলাকার কাজের টেন্ডার ও শেষ তারিখ", den: "Local tenders and deadlines" },
  { to: "/rights", icon: Scale, bn: "নাগরিক গাইড", en: "Citizen guide", dbn: "তথ্য চাওয়া, ওয়ার্ড সভা, সমস্যা হলে কোথায় যাবেন", den: "Asking for information, meetings, getting help" },
  { to: "/documents", icon: FolderOpen, bn: "মূল কাগজপত্র", en: "Original documents", dbn: "সব তথ্যের সরকারি উৎস", den: "Official sources for everything here" },
  { to: "/about", icon: Info, bn: "আমাদের সম্পর্কে", en: "About us", dbn: "জনতার হিসাব কী, কারা চালায়", den: "What Jonotar Hisab is and who runs it" },
];

function Tiles({ items, compact = false, label }: { items: Section[]; compact?: boolean; label: string }) {
  const t = useT();
  return (
    <nav className={`menu${compact ? " menu-compact" : ""}`} aria-label={label}>
      {items.map((x) => (
        <Link key={x.to} to={x.to} className={`menu-item${x.tone ? ` tone-${x.tone}` : ""}`}>
          <span className="menu-icon"><x.icon size={24} aria-hidden /></span>
          <span className="grow"><strong>{t(x.bn, x.en)}</strong><span className="muted">{t(x.dbn, x.den)}</span></span>
          <ChevronRight size={20} aria-hidden className="menu-chevron" />
        </Link>
      ))}
    </nav>
  );
}

export function QuickActions() {
  const t = useT();
  return <Tiles items={QUICK_ACTIONS} label={t("দ্রুত যান", "Quick actions")} />;
}

export function MoreSections() {
  const t = useT();
  return <Tiles items={MORE_SECTIONS} compact label={t("আরও বিভাগ", "More sections")} />;
}
