import { RIGHTS_TOPICS } from "../content/rights";
import { SERVICE_GUIDES } from "../content/service-guides";
import type { SearchEntry } from "../lib/search";
import type { Dataset } from "./schemas";

const PAGES: SearchEntry[] = [
  { title_bn: "সেবা পাবেন কীভাবে", title_en: "How to get services", keywords: "সেবা সনদ ফি নিবন্ধন certificate fee service guide", url: "/services", kind: "page" },
  { title_bn: "ভাতা যাচাই — আমি কি পাব?", title_en: "Allowance eligibility check", keywords: "ভাতা বয়স্ক বিধবা প্রতিবন্ধী মা শিশু allowance old age widow disability eligibility", url: "/allowances/check", kind: "page" },
  { title_bn: "ভাতা ও সহায়তা", title_en: "Allowances", keywords: "ভাতা সহায়তা ভিজিডি ভিজিএফ allowance vgd vgf", url: "/allowances", kind: "page" },
  { title_bn: "দরকারি নম্বর", title_en: "Useful numbers", keywords: "জরুরি হেল্পলাইন ফোন নম্বর পুলিশ অ্যাম্বুলেন্স emergency helpline phone police hospital", url: "/contacts", kind: "page" },
  { title_bn: "নোটিশ ও খবর", title_en: "Notices & news", keywords: "নোটিশ খবর বিজ্ঞপ্তি notice news", url: "/notices", kind: "page" },
  { title_bn: "ইউনিয়নের বাজেট", title_en: "Union budget", keywords: "বাজেট আয় ব্যয় খরচ budget income spending", url: "/budget", kind: "page" },
  { title_bn: "উন্নয়ন কাজ", title_en: "Development works", keywords: "উন্নয়ন কাজ প্রকল্প রাস্তা মসজিদ স্কুল project road works", url: "/projects", kind: "page" },
  { title_bn: "টেন্ডার (দরপত্র)", title_en: "Tenders", keywords: "টেন্ডার দরপত্র ঠিকাদার tender contractor", url: "/tenders", kind: "page" },
  { title_bn: "আপনার এলাকা — ওয়ার্ড", title_en: "Your area — wards", keywords: "ওয়ার্ড গ্রাম এলাকা ward village", url: "/wards", kind: "page" },
  { title_bn: "নাগরিক গাইড", title_en: "Citizen guide", keywords: "অধিকার তথ্য অভিযোগ ওয়ার্ড সভা rights rti complaint", url: "/rights", kind: "page" },
  { title_bn: "মূল কাগজপত্র", title_en: "Original documents", keywords: "কাগজ নথি document source", url: "/documents", kind: "page" },
  { title_bn: "আমাদের সম্পর্কে", title_en: "About", keywords: "জনতার খাতা about", url: "/about", kind: "page" },
];

export function buildSearchEntries(ds: Dataset): SearchEntry[] {
  return [
    ...PAGES,
    ...SERVICE_GUIDES.map((g) => ({ title_bn: g.title_bn, title_en: g.title_en, keywords: `${g.keywords} ${g.summary_bn} ${g.summary_en}`, url: `/services/${g.id}`, kind: "service" as const })),
    ...RIGHTS_TOPICS.map((r) => ({ title_bn: r.title_bn, title_en: r.title_en, keywords: `${r.summary_bn} ${r.summary_en}`, url: `/rights/${r.key}`, kind: "guide" as const })),
    ...ds.contacts.map((c) => ({ title_bn: c.name_bn, title_en: c.name_en, keywords: `${c.number} ${c.note_bn ?? ""} ফোন নম্বর`, url: "/contacts", kind: "contact" as const })),
    ...ds.union.wards.map((w) => ({ title_bn: `ওয়ার্ড ${w.no}`, title_en: `Ward ${w.no}`, keywords: [...w.villages_bn, ...w.villages_en].join(" "), url: `/ward/${w.no}`, kind: "ward" as const })),
    ...ds.projects.map((p) => ({ title_bn: p.name_bn, title_en: p.name_en ?? "", keywords: `${p.village_bn ?? ""} উন্নয়ন কাজ`, url: `/projects/${p.id}`, kind: "work" as const })),
    ...ds.tenders.map((x) => ({ title_bn: x.title_bn, title_en: x.title_en ?? "", keywords: "টেন্ডার দরপত্র tender", url: `/tenders/${x.id}`, kind: "tender" as const })),
  ];
}
