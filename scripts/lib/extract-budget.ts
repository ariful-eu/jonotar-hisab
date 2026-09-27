import { BudgetLine, CATEGORY_KEYS, KINDS } from "../../app/data/schemas";

const CATEGORY_HINTS: Record<string, string> = {
  own_tax: "বসতবাড়ি/হোল্ডিং কর, ট্রেড লাইসেন্স, ভ্যান-রিক্সা কর ইত্যাদি স্থানীয় কর",
  fees: "সনদ, রেজিস্ট্রেশন ও অন্যান্য ফি বাবদ আয়",
  hat_bazar: "হাট-বাজার ইজারা থেকে আয়",
  ldt_1pct: "জমি হস্তান্তর কর ১% অংশ",
  salary_grant: "চেয়ারম্যান/সদস্য/সচিব/গ্রাম পুলিশের বেতন-সম্মানী বাবদ সরকারি অনুদান (আয় পক্ষ)",
  adp: "এডিপি বরাদ্দ",
  block_grant: "এলজিএসপি/উন্নয়ন সহায়তা থোক বরাদ্দ",
  food_programmes: "টিআর, কাবিখা, কাবিটা",
  safety_net: "ভিজিডি, ভিজিএফ, ভিডব্লিউবি",
  employment: "ইজিপিপি (৪০ দিনের কর্মসূচি)",
  other_grant: "অন্যান্য অনুদান (উপরের কোনোটির সাথে না মিললে)",
  establishment: "সংস্থাপন ব্যয়: সম্মানী, বেতন, অফিস খরচ, কর আদায় কমিশন (ব্যয় পক্ষ)",
  roads: "রাস্তা, কালভার্ট, ড্রেন, ব্রিজ নির্মাণ/মেরামত",
  health: "স্বাস্থ্য ও পয়ঃনিষ্কাশন",
  education: "শিক্ষা ও খেলাধুলা",
  agriculture: "কৃষি ও বৃক্ষরোপণ",
  water: "পানি সরবরাহ",
  relief: "ত্রাণ ও দুর্যোগ ব্যবস্থাপনা",
  other: "উপরের কোনো খাতে না পড়লে",
};

export function buildExtractionPrompt(o: { union: string; docId: string; fiscalYearHint?: string }): string {
  const categoryList = CATEGORY_KEYS.map((k) => `- ${k}: ${CATEGORY_HINTS[k]}`).join("\n");
  return `You are reading a scanned Bangladeshi Union Parishad budget document (union: "${o.union}", our internal document id: "${o.docId}"${o.fiscalYearHint ? `, expected fiscal year around ${o.fiscalYearHint}` : ""}).

Transcribe every LEAF line item (not subtotals or grand totals) from both the income (আয়) and expenditure (ব্যয়) tables. If the document shows several columns (e.g. proposed/প্রস্তাবিত, revised/সংশোধিত, actual/প্রকৃত for different fiscal years), emit ONE row per column per line item, each with its own "kind" and "fiscal_year".

For each row, output exactly these fields:
- "head_bn": the exact Bangla head name as printed
- "head_en": a short English translation
- "direction": "income" or "expense"
- "category": pick the SINGLE best match from this fixed list — never invent a new one:
${categoryList}
- "amount": the amount exactly as printed (keep Bangla digits, commas, "/-" if present — do not compute or round)
- "kind": "proposed", "revised", or "actual"
- "fiscal_year": like "2026-27" (use the year that specific column covers)

Respond with ONLY a JSON array of these objects, nothing else — no prose, no markdown fence, no explanation. If you cannot read the document at all, respond with an empty array [].`;
}

export function parseModelJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const arrayMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("Model response contained no JSON array");
  return JSON.parse(arrayMatch[0]);
}

export type DraftBudgetRow = Record<string, string>;

const RawRow = BudgetLine.omit({ union: true, source_type: true, source_doc: true, status: true }).extend({
  fiscal_year: BudgetLine.shape.fiscal_year.optional(),
  kind: BudgetLine.shape.kind.optional(),
});

export function buildDraftRows(modelOutput: unknown, o: { union: string; docId: string; fiscalYear: string }): { rows: DraftBudgetRow[]; errors: string[] } {
  if (!Array.isArray(modelOutput)) return { rows: [], errors: ["Model response was not a JSON array"] };
  const rows: DraftBudgetRow[] = [];
  const errors: string[] = [];
  modelOutput.forEach((raw, i) => {
    const withDefaults = { fiscal_year: o.fiscalYear, kind: "proposed" as (typeof KINDS)[number], ...(raw as object) };
    const parsed = RawRow.safeParse(withDefaults);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      errors.push(`row ${i + 1}, column ${String(issue.path[0] ?? "?")}: ${issue.message}`);
      return;
    }
    rows.push({
      union: o.union,
      fiscal_year: parsed.data.fiscal_year!,
      kind: parsed.data.kind!,
      direction: parsed.data.direction,
      category: parsed.data.category,
      head_bn: parsed.data.head_bn,
      head_en: parsed.data.head_en ?? "",
      amount: String(parsed.data.amount),
      source_type: "union",
      source_doc: o.docId,
      status: "draft",
    });
  });
  return { rows, errors };
}

export function looksLikeBudgetDoc(doc: { title_bn: string; url: string }): boolean {
  return /বাজেট|budget/i.test(doc.title_bn) || /budget/i.test(doc.url);
}

export type SupportedMediaType = "application/pdf" | "image/png" | "image/jpeg";

export function mediaTypeForExt(ext: string): SupportedMediaType | null {
  const e = ext.toLowerCase();
  return e === ".pdf" ? "application/pdf" : e === ".png" ? "image/png" : e === ".jpg" || e === ".jpeg" ? "image/jpeg" : null;
}

export function toContentBlock(mediaType: SupportedMediaType, data: string) {
  return mediaType === "application/pdf"
    ? { type: "document" as const, source: { type: "base64" as const, media_type: mediaType, data } }
    : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data } };
}
