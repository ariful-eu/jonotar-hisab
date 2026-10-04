import { Link } from "react-router";
import { Logo } from "./Logo";
import { useFmt, useT } from "../lib/i18n";

export function Footer() {
  const t = useT();
  const f = useFmt();
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label={t("সব পাতা", "All pages")}>
          <Link to="/services">{t("সেবা", "Services")}</Link>
          <Link to="/allowances/check">{t("ভাতা যাচাই", "Allowance check")}</Link>
          <Link to="/contacts">{t("দরকারি নম্বর", "Useful numbers")}</Link>
          <Link to="/notices">{t("নোটিশ", "Notices")}</Link>
          <Link to="/budget">{t("বাজেট", "Budget")}</Link>
          <Link to="/projects">{t("উন্নয়ন কাজ", "Works")}</Link>
          <Link to="/tenders">{t("টেন্ডার", "Tenders")}</Link>
          <Link to="/wards">{t("ওয়ার্ড", "Wards")}</Link>
          <Link to="/allowances">{t("ভাতা", "Allowances")}</Link>
          <Link to="/rights">{t("নাগরিক গাইড", "Citizen guide")}</Link>
          <Link to="/documents">{t("মূল কাগজপত্র", "Documents")}</Link>
          <Link to="/about">{t("আমাদের সম্পর্কে", "About")}</Link>
        </nav>
        <p>{t("জনতার খাতা একটি স্বাধীন নাগরিক তথ্যসেবা। সব তথ্য সরকারি নথি থেকে নেওয়া, উৎসসহ। ভুল চোখে পড়লে জানান — ঠিক করে দেব।", "Jonotar Khata is an independent citizen information service. Everything comes from government documents, with sources. Spot a mistake? Tell us and we'll fix it.")}</p>
        <p>{t(`সর্বশেষ হালনাগাদ: ${f.date(__BUILD_DATE__)}`, `Last updated: ${f.date(__BUILD_DATE__)}`)}</p>
        <div className="footer-bottom">
          <p className="footer-brand"><Logo size={28} /> <span>{t(`© ${f.digits(__BUILD_DATE__.slice(0, 4))} জনতার খাতা। সর্বস্বত্ব সংরক্ষিত।`, `© ${__BUILD_DATE__.slice(0, 4)} Jonotar Khata. All rights reserved.`)}</span></p>
          <p className="credit">{t("তোরাপগঞ্জ, টাঙ্গাইল থেকে ❤️ দিয়ে ডিজাইন ও তৈরি করেছে ", "Designed and Developed with ❤️ in Torapganj, Tangail by ")}<a href="https://miah-softwares-site.trendy-outfit.workers.dev/" target="_blank" rel="noopener">{t("মিয়া সফটওয়্যারস", "Miah Softwares")}</a></p>
        </div>
      </div>
    </footer>
  );
}
