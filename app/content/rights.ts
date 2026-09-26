export type RightsPoint = { bn: string; en: string };
export type RightsSection = { heading_bn: string; heading_en: string; points: RightsPoint[] };
export type RightsLink = { label_bn: string; label_en: string; href: string };
export type RightsTopic = { key: "rti" | "ward-shava" | "open-budget" | "complain"; title_bn: string; title_en: string; summary_bn: string; summary_en: string; sections: RightsSection[]; links: RightsLink[]; source_docs: string[] };
export const RIGHTS_TOPICS: RightsTopic[] = [];
