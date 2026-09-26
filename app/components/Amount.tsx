import { useFmt } from "../lib/i18n";
import { Unknown } from "./Unknown";

export function Amount({ value, full = false, rti }: { value: number | null; full?: boolean; rti?: string }) {
  const f = useFmt();
  if (value === null) return <Unknown rti={rti} />;
  return <span className="amount">{full ? f.takaFull(value) : f.taka(value)}</span>;
}
