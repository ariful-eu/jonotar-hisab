import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { useT } from "../lib/i18n";

export function StatusIcon({ s }: { s: "yes" | "no" | "partial" }) {
  const t = useT();
  const Icon = s === "yes" ? CheckCircle2 : s === "no" ? XCircle : CircleDot;
  const label = s === "yes" ? t("প্রকাশিত", "Published") : s === "no" ? t("প্রকাশিত নয়", "Not published") : t("আংশিক", "Partial");
  return (
    <span className={s}>
      <Icon size={20} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
