import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { digits, formatDate, formatFy, formatNumber, formatTaka, formatTakaFull, type Lang } from "./format";

const KEY = "katuli-lang";
type LangCtx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<LangCtx>({ lang: "bn", setLang: () => {} });

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "bn";
  } catch {
    return "bn";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => setLangState(readStoredLang()), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // storage unavailable: keep the choice for this session only
    }
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return (bn: string, en: string) => (lang === "bn" ? bn : en);
}

export function useFmt() {
  const { lang } = useLang();
  return {
    lang,
    taka: (n: number) => formatTaka(n, lang),
    takaFull: (n: number) => formatTakaFull(n, lang),
    num: (n: number) => formatNumber(n, lang),
    digits: (n: number | string) => digits(n, lang),
    date: (iso: string) => formatDate(iso, lang),
    fy: (fy: string) => formatFy(fy, lang),
  };
}

export function pick(row: object, base: string, lang: Lang): string {
  const r = row as Record<string, unknown>;
  const preferred = r[`${base}_${lang}`];
  if (typeof preferred === "string" && preferred !== "") return preferred;
  return String(r[`${base}_bn`] ?? "");
}
