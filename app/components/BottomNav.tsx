import { ClipboardList, HandHeart, House, MapPin, PhoneCall } from "lucide-react";
import { NavLink } from "react-router";
import { useT } from "../lib/i18n";

export const NAV_ITEMS = [
  { to: "/", end: true, icon: House, bn: "হোম", en: "Home" },
  { to: "/services", end: false, icon: ClipboardList, bn: "সেবা", en: "Services" },
  { to: "/allowances", end: false, icon: HandHeart, bn: "ভাতা", en: "Allowances" },
  { to: "/contacts", end: false, icon: PhoneCall, bn: "নম্বর", en: "Numbers" },
  { to: "/wards", end: false, icon: MapPin, bn: "এলাকা", en: "My area" },
];

export const TOP_NAV_ITEMS = [
  { to: "/", end: true, bn: "হোম", en: "Home" },
  { to: "/services", end: false, bn: "সেবা", en: "Services" },
  { to: "/allowances", end: false, bn: "ভাতা", en: "Allowances" },
  { to: "/contacts", end: false, bn: "দরকারি নম্বর", en: "Numbers" },
  { to: "/notices", end: false, bn: "নোটিশ", en: "Notices" },
  { to: "/budget", end: false, bn: "বাজেট", en: "Budget" },
  { to: "/rights", end: false, bn: "নাগরিক গাইড", en: "Citizen guide" },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="bottom-nav" aria-label={t("প্রধান মেনু", "Main menu")}>
      {NAV_ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? "active" : undefined)}>
          <i.icon size={22} aria-hidden />
          {t(i.bn, i.en)}
        </NavLink>
      ))}
    </nav>
  );
}
