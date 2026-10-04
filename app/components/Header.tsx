import { Link, NavLink } from "react-router";
import { Logo } from "./Logo";
import { TOP_NAV_ITEMS } from "./BottomNav";
import { useLang, useT } from "../lib/i18n";

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <>
      <div className="banner" role="note">{t("স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি ওয়েবসাইট নয়", "Independent citizens' initiative — not a government website")}</div>
      <header className="site-header">
        <div className="bar">
          <Link to="/" className="brand"><Logo size={40} /><span className="brand-text"><span>{t("জনতার হিসাব", "Jonotar Hisab")}</span><small>{t("কাতুলী ইউনিয়নের বাজেট", "Katuli Union budget")}</small></span></Link>
          <nav className="top-nav" aria-label={t("প্রধান মেনু", "Main menu")}>
            {TOP_NAV_ITEMS.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? "active" : undefined)}>{t(i.bn, i.en)}</NavLink>
            ))}
          </nav>
          <button type="button" className="btn btn-small" lang={lang === "bn" ? "en" : "bn"} onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
        </div>
      </header>
    </>
  );
}
