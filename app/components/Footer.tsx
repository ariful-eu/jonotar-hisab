import { Link } from "react-router";
import { useFmt, useT } from "../lib/i18n";

export function Footer() {
  const t = useT();
  const f = useFmt();
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label={t("সব পাতা", "All pages")}>
          <Link to="/budget">{t("আয়-ব্যয়", "Budget")}</Link>
          <Link to="/projects">{t("উন্নয়ন কাজ", "Works")}</Link>
          <Link to="/tenders">{t("টেন্ডার", "Tenders")}</Link>
          <Link to="/wards">{t("ওয়ার্ড", "Wards")}</Link>
          <Link to="/services">{t("সেবার ফি", "Service fees")}</Link>
          <Link to="/allowances">{t("ভাতা", "Allowances")}</Link>
          <Link to="/rights">{t("অধিকার", "Rights")}</Link>
          <Link to="/documents">{t("মূল কাগজপত্র", "Documents")}</Link>
          <Link to="/about">{t("আমাদের সম্পর্কে", "About")}</Link>
        </nav>
        <p>{t("এখানের তথ্য সরকারি নথি ও স্বেচ্ছাসেবকদের পর্যবেক্ষণ থেকে নেওয়া। কোনো অমিল মানেই অনিয়মের প্রমাণ নয়।", "Data comes from government documents and volunteer observations. A discrepancy is not proof of wrongdoing.")}</p>
        <p>{t(`সর্বশেষ হালনাগাদ: ${f.date(__BUILD_DATE__)}`, `Last updated: ${f.date(__BUILD_DATE__)}`)}</p>
      </div>
    </footer>
  );
}
