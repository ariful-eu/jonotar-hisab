import { FolderOpen, Gavel, Hammer, HandHeart, MapPin, Receipt, Scale, Wallet } from "lucide-react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

const TILES = [
  { to: "/budget", icon: Wallet, bn: "বাজেট", en: "Budget" },
  { to: "/projects", icon: Hammer, bn: "প্রকল্প", en: "Projects" },
  { to: "/tenders", icon: Gavel, bn: "দরপত্র", en: "Tenders" },
  { to: "/wards", icon: MapPin, bn: "আমার ওয়ার্ড", en: "My ward" },
  { to: "/services", icon: Receipt, bn: "সেবার ফি", en: "Service fees" },
  { to: "/allowances", icon: HandHeart, bn: "ভাতা", en: "Allowances" },
  { to: "/rights", icon: Scale, bn: "আপনার অধিকার", en: "Your rights" },
  { to: "/documents", icon: FolderOpen, bn: "নথিপত্র", en: "Documents" },
];

export function SectionTiles() {
  const t = useT();
  return (
    <nav className="tiles" aria-label={t("বিভাগসমূহ", "Sections")}>
      {TILES.map((x) => (
        <Link key={x.to} to={x.to} className="tile">
          <x.icon size={30} aria-hidden />
          {t(x.bn, x.en)}
        </Link>
      ))}
    </nav>
  );
}
