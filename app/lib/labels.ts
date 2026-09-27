import type { Issuer, Kind, SourceType } from "../data/schemas";

type L = { bn: string; en: string };

export const KIND_LABEL: Record<Kind, L> = {
  proposed: { bn: "প্রস্তাবিত", en: "Proposed" },
  revised: { bn: "সংশোধিত", en: "Revised" },
  actual: { bn: "প্রকৃত", en: "Actual" },
};
export const SOURCE_TYPE_LABEL: Record<SourceType, L> = {
  union: { bn: "ইউনিয়নের নিজের কাগজ", en: "Union's own document" },
  upstream: { bn: "অন্য সরকারি অফিসের কাগজ", en: "Other government office" },
  observed: { bn: "স্বেচ্ছাসেবকের পর্যবেক্ষণ", en: "Volunteer observation" },
};
export const ISSUER_LABEL: Record<Issuer, L> = {
  union: { bn: "ইউনিয়ন পরিষদ", en: "Union Parishad" },
  upazila: { bn: "উপজেলা", en: "Upazila" },
  district: { bn: "জেলা", en: "District" },
  ministry: { bn: "মন্ত্রণালয়/অধিদপ্তর", en: "Ministry/department" },
  volunteer: { bn: "স্বেচ্ছাসেবক", en: "Volunteer" },
  other: { bn: "অন্যান্য", en: "Other" },
};
export const SCHEME_LABEL: Record<string, L> = {
  adp: { bn: "এডিপি", en: "ADP" },
  lgsp: { bn: "ইউনিয়ন উন্নয়ন সহায়তা (এলজিএসপি)", en: "LGSP / block grant" },
  lged: { bn: "এলজিইডির কাজ", en: "LGED works" },
  tr: { bn: "টিআর", en: "TR" },
  kabita: { bn: "কাবিটা (কাজের বিনিময়ে টাকা)", en: "KABITA (cash for work)" },
  kabikha: { bn: "কাবিখা (কাজের বিনিময়ে খাদ্য)", en: "KABIKHA (food for work)" },
  egpp: { bn: "৪০ দিনের কর্মসূচি (ইজিপিপি)", en: "40-day employment (EGPP)" },
  gr: { bn: "ত্রাণ (জিআর)", en: "Relief (GR)" },
  own: { bn: "নিজস্ব তহবিল", en: "Own funds" },
  other: { bn: "অন্যান্য", en: "Other" },
};
export const PROJECT_STATUS_LABEL: Record<string, L> = {
  planned: { bn: "শুরু হবে", en: "Planned" },
  ongoing: { bn: "চলমান", en: "Ongoing" },
  completed: { bn: "শেষ হয়েছে (কাগজে)", en: "Completed (on paper)" },
  unknown: { bn: "অবস্থা জানা নেই", en: "Status unknown" },
};
export const OBSERVED_LABEL: Record<string, L> = {
  not_started: { bn: "কাজ শুরু হয়নি", en: "Not started" },
  in_progress: { bn: "কাজ চলছে", en: "In progress" },
  completed: { bn: "কাজ শেষ দেখা গেছে", en: "Seen completed" },
  not_found: { bn: "স্থানে কাজ পাওয়া যায়নি", en: "Not found on site" },
  unclear: { bn: "অস্পষ্ট", en: "Unclear" },
};
