import { Hammer, House, MapPin, Scale, Wallet } from "lucide-react";
import { NavLink } from "react-router";
import { useT } from "../lib/i18n";

const ITEMS = [
  { to: "/", end: true, icon: House, bn: "হোম", en: "Home" },
  { to: "/budget", end: false, icon: Wallet, bn: "বাজেট", en: "Budget" },
  { to: "/projects", end: false, icon: Hammer, bn: "প্রকল্প", en: "Projects" },
  { to: "/wards", end: false, icon: MapPin, bn: "ওয়ার্ড", en: "Wards" },
  { to: "/rights", end: false, icon: Scale, bn: "অধিকার", en: "Rights" },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="bottom-nav" aria-label={t("প্রধান মেনু", "Main menu")}>
      {ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? "active" : undefined)}>
          <i.icon size={22} aria-hidden />
          {t(i.bn, i.en)}
        </NavLink>
      ))}
    </nav>
  );
}
