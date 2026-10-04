export type Bi = { bn: string; en: string };
export type GuideWhere = { kind: "up" | "udc" | "online" | "other"; label_bn: string; label_en: string; url?: string };
export type ServiceGuide = {
  id: string;
  icon: "baby" | "skull" | "id" | "users" | "store" | "landmark" | "hand" | "file";
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  keywords: string;
  who: Bi[];
  papers: Bi[];
  fee_ids: string[];
  fee_note?: Bi;
  time?: Bi;
  where: GuideWhere[];
  steps: Bi[];
  tips: Bi[];
  source_docs: string[];
};

export const SERVICE_GUIDES: ServiceGuide[] = [];
