import { Coins } from "lucide-react";
import { Link } from "react-router";
import { useLang, useT } from "../lib/i18n";

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <>
      <div className="banner" role="note">{t("স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি ওয়েবসাইট নয়", "Independent citizens' initiative — not a government website")}</div>
      <header className="site-header">
        <div className="bar">
          <Link to="/" className="brand"><Coins size={24} aria-hidden />{t("কাতুলীর বাজেট", "Katuli Budget")}</Link>
          <button type="button" className="btn btn-small" lang={lang === "bn" ? "en" : "bn"} onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
        </div>
      </header>
    </>
  );
}
