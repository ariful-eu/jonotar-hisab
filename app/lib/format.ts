export type Lang = "bn" | "en";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function parseAmount(raw: string): number | null {
  const cleaned = toEnDigits(raw).replace(/৳|টাকা|tk\.?|,|\s/gi, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "–") return null;
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

const locale = (lang: Lang) => (lang === "bn" ? "bn-BD" : "en-IN");

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(n);
}

export function digits(n: number | string, lang: Lang): string {
  return lang === "bn" ? toBnDigits(n) : String(n);
}

const prefix = (lang: Lang) => (lang === "bn" ? "৳" : "Tk ");

export function formatTakaFull(n: number, lang: Lang): string {
  return `${prefix(lang)}${formatNumber(Math.round(n), lang)}`;
}

export function formatTaka(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const unit = abs >= 1e7 ? { div: 1e7, bn: "কোটি", en: "crore" } : abs >= 1e5 ? { div: 1e5, bn: "লাখ", en: "lakh" } : null;
  if (!unit) return formatTakaFull(n, lang);
  const value = Math.round((n / unit.div) * 10) / 10;
  return `${prefix(lang)}${formatNumber(value, lang)} ${unit[lang]}`;
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatFy(fy: string, lang: Lang): string {
  return digits(fy, lang);
}

export function perHousehold(total: number, households: number | null | undefined): number | null {
  return households && households > 0 ? Math.round(total / households) : null;
}
