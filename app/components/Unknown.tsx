import { Link } from "react-router";
import { useT } from "../lib/i18n";

export function Unknown({ rti }: { rti?: string }) {
  const t = useT();
  return (
    <span className="chip chip-low" title={t("এই তথ্য প্রকাশ করা হয়নি", "This has not been published")}>
      {t("তথ্য নেই", "Not published")}
      {rti ? <> · <Link to={`/rights/rti?item=${rti}`}>{t("তথ্য চান", "Ask")}</Link></> : null}
    </span>
  );
}
