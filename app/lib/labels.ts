import type { Issuer, Kind, SourceType } from "../data/schemas";

type L = { bn: string; en: string };

export const KIND_LABEL: Record<Kind, L> = {
  proposed: { bn: "প্রস্তাবিত", en: "proposed" },
  revised: { bn: "সংশোধিত", en: "revised" },
  actual: { bn: "প্রকৃত", en: "actual" },
};
export const SOURCE_TYPE_LABEL: Record<SourceType, L> = {
  union: { bn: "ইউনিয়নের নথি", en: "Union document" },
  upstream: { bn: "অন্য সরকারি অফিসের নথি", en: "Other government office" },
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
  lgsp: { bn: "এলজিএসপি/থোক বরাদ্দ", en: "LGSP / block grant" },
  tr: { bn: "টিআর", en: "TR" },
  kabita: { bn: "কাবিটা", en: "KABITA" },
  kabikha: { bn: "কাবিখা", en: "KABIKHA" },
  egpp: { bn: "অতিদরিদ্রের কর্মসংস্থান (ইজিপিপি)", en: "EGPP employment" },
  gr: { bn: "জিআর (ত্রাণ)", en: "GR relief" },
  own: { bn: "নিজস্ব তহবিল", en: "Own funds" },
  other: { bn: "অন্যান্য", en: "Other" },
};
export const PROJECT_STATUS_LABEL: Record<string, L> = {
  planned: { bn: "পরিকল্পিত", en: "Planned" },
  ongoing: { bn: "চলমান", en: "Ongoing" },
  completed: { bn: "সম্পন্ন (নথি অনুযায়ী)", en: "Completed (per documents)" },
  unknown: { bn: "অবস্থা অজানা", en: "Status unknown" },
};
export const OBSERVED_LABEL: Record<string, L> = {
  not_started: { bn: "কাজ শুরু হয়নি", en: "Not started" },
  in_progress: { bn: "কাজ চলছে", en: "In progress" },
  completed: { bn: "কাজ শেষ দেখা গেছে", en: "Seen completed" },
  not_found: { bn: "স্থানে কাজ পাওয়া যায়নি", en: "Not found on site" },
  unclear: { bn: "অস্পষ্ট", en: "Unclear" },
};
