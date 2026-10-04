import { toEnDigits } from "./format";

export function telHref(number: string): string {
  const s = toEnDigits(number).trim();
  return `tel:${s.startsWith("+") ? "+" : ""}${s.replace(/\D/g, "")}`;
}
