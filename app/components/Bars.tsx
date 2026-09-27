import type { BarItem } from "../data/categories";
import { useFmt, useT } from "../lib/i18n";
import { Unknown } from "./Unknown";

export type { BarItem };

export function Bars({ items, tone, format = "taka", max: sharedMax }: { items: BarItem[]; tone: "income" | "expense"; format?: "taka" | "takaFull"; max?: number }) {
  const f = useFmt();
  const t = useT();
  if (items.length === 0) return <p className="muted">{t("তথ্য নেই", "No data")}</p>;
  const max = sharedMax ?? Math.max(0, ...items.map((i) => i.amount ?? 0));
  return (
    <ul className="bars">
      {items.map((i) => {
        const pct = max > 0 && i.amount !== null ? Math.max(2, Math.round((i.amount / max) * 100)) : 0;
        const Icon = i.icon;
        return (
          <li key={i.key} className={i.highlight ? "hl" : undefined}>
            <div className="bar-label">
              <span className="bar-name">
                {Icon ? <Icon size={20} aria-hidden /> : null}
                <span>{i.label}{i.note ? <span className="muted"> · {i.note}</span> : null}</span>
              </span>
              <strong>{i.amount === null ? <Unknown /> : f[format](i.amount)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${pct}%`, background: `var(--${tone})` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
