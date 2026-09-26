import { useEffect, useState } from "react";
import { useFmt, useT } from "../lib/i18n";
import { Unknown } from "./Unknown";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const t = useT();
  const f = useFmt();
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const end = Date.parse(`${deadline}T23:59:59+06:00`);
    setDays(Math.ceil((end - Date.now()) / 86_400_000));
  }, [deadline]);
  if (!deadline) return <Unknown />;
  const closed = days !== null && days < 0;
  return (
    <span className={`chip ${closed ? "" : "chip-union"}`}>
      {f.date(deadline)}
      {days === null ? "" : closed ? t(" · বন্ধ", " · closed") : t(` · ${f.digits(days)} দিন বাকি`, ` · ${days} days left`)}
    </span>
  );
}
