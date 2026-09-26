import { Link } from "react-router";
import { useT } from "../lib/i18n";

export function Unknown({ rti }: { rti?: string }) {
  const t = useT();
  return (
    <span className="chip chip-low" title={t("এই তথ্য প্রকাশ করা হয়নি", "This has not been published")}>
      {t("অজানা", "Unknown")}
      {rti ? <> · <Link to={`/rights/rti?item=${rti}`}>{t("চেয়ে নিন", "Request")}</Link></> : null}
    </span>
  );
}
