import { Banknote, Briefcase, Building2, CircleEllipsis, Droplets, Gift, GraduationCap, HandHeart, HeartPulse, House, Landmark, LifeBuoy, type LucideIcon, Receipt, Route, Sprout, Store, Users, Wheat } from "lucide-react";
import type { Lang } from "../lib/format";
import type { CategoryKey } from "./schemas";

export type BarItem = { key: string; label: string; amount: number | null; icon?: LucideIcon; note?: string; highlight?: boolean };

export const CATEGORIES: Record<CategoryKey, { bn: string; en: string; icon: LucideIcon }> = {
  own_tax: { bn: "বসতবাড়ি ও ব্যবসার কর", en: "Own taxes (holding, trade)", icon: House },
  fees: { bn: "ফি ও সনদ বাবদ আয়", en: "Fees, certificates & licences", icon: Receipt },
  hat_bazar: { bn: "হাট-বাজার ইজারা", en: "Market (hat-bazar) lease", icon: Store },
  ldt_1pct: { bn: "জমি কেনাবেচার করের ভাগ (১%)", en: "Land transfer tax (1%)", icon: Landmark },
  salary_grant: { bn: "সরকার থেকে বেতন-সম্মানী", en: "Govt grant for honoraria & salaries", icon: Banknote },
  adp: { bn: "সরকারের উন্নয়ন বরাদ্দ (এডিপি)", en: "ADP development grant", icon: Building2 },
  block_grant: { bn: "ইউনিয়ন উন্নয়ন সহায়তা (থোক বরাদ্দ)", en: "Block grant (LGSP / dev. support)", icon: Gift },
  food_programmes: { bn: "কাজের বিনিময়ে খাদ্য/টাকা (টিআর, কাবিখা, কাবিটা)", en: "Food/cash for work (TR, KABIKHA, KABITA)", icon: Wheat },
  safety_net: { bn: "গরিবদের চাল ও সহায়তা (ভিজিডি, ভিজিএফ)", en: "VGD / VGF & safety nets", icon: HandHeart },
  employment: { bn: "৪০ দিনের কর্মসূচি (ইজিপিপি)", en: "Employment programme (EGPP)", icon: Briefcase },
  other_grant: { bn: "অন্যান্য অনুদান", en: "Other grants", icon: Gift },
  establishment: { bn: "বেতন, সম্মানী ও অফিস খরচ", en: "Honoraria, salaries & office", icon: Users },
  roads: { bn: "রাস্তা, কালভার্ট ও ড্রেন", en: "Roads, culverts & drains", icon: Route },
  health: { bn: "স্বাস্থ্য ও পয়ঃনিষ্কাশন", en: "Health & sanitation", icon: HeartPulse },
  education: { bn: "শিক্ষা ও খেলাধুলা", en: "Education & sports", icon: GraduationCap },
  agriculture: { bn: "কৃষি", en: "Agriculture", icon: Sprout },
  water: { bn: "পানি", en: "Water", icon: Droplets },
  relief: { bn: "ত্রাণ ও সহায়তা", en: "Relief & support", icon: LifeBuoy },
  other: { bn: "অন্যান্য", en: "Other", icon: CircleEllipsis },
};

export function categoryItems(totals: { category: CategoryKey; amount: number }[], lang: Lang): BarItem[] {
  return totals.map((c) => ({ key: c.category, label: CATEGORIES[c.category][lang], amount: c.amount, icon: CATEGORIES[c.category].icon }));
}
