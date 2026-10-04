import { z } from "zod";
import { parseAmount, toEnDigits } from "../lib/format";

const blankToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);
const enDigits = (v: unknown) => (typeof v === "string" ? toEnDigits(v.trim()) : v);

const text = z.string().trim().min(1, "required");
const optText = z.preprocess(blankToNull, z.string().trim().nullable());
const amount = z.preprocess((v) => (typeof v === "string" ? parseAmount(v) : v), z.number());
const optAmount = z.preprocess((v) => (typeof v === "string" ? parseAmount(v) : v ?? null), z.number().nullable());
const isoDate = z.preprocess(enDigits, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected date as YYYY-MM-DD"));
const optDate = z.preprocess((v) => blankToNull(enDigits(v)), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected date as YYYY-MM-DD").nullable());
const fiscalYear = z.preprocess(enDigits, z.string().regex(/^\d{4}-\d{2}$/, "expected fiscal year like 2026-27"));
const optFiscalYear = z.preprocess((v) => blankToNull(enDigits(v)), z.string().regex(/^\d{4}-\d{2}$/, "expected fiscal year like 2026-27").nullable());
const slug = z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/, "expected lowercase id with dashes, e.g. katuli-budget-2014-15");
const optWard = z.preprocess((v) => {
  const b = blankToNull(v);
  return b === null ? null : Number(toEnDigits(String(b)));
}, z.number().int().min(1).max(9).nullable());
const rowStatus = z.enum(["draft", "published", "ignored"]);

export const SOURCE_TYPES = ["union", "upstream", "observed"] as const;
export const KINDS = ["proposed", "revised", "actual"] as const;
export const ISSUERS = ["union", "upazila", "district", "ministry", "volunteer", "other"] as const;
export const SCHEMES = ["adp", "lgsp", "lged", "tr", "kabita", "kabikha", "egpp", "gr", "own", "other"] as const;
export const PROJECT_STATUSES = ["planned", "ongoing", "completed", "unknown"] as const;
export const OBSERVED = ["not_started", "in_progress", "completed", "not_found", "unclear"] as const;
export const CATEGORY_KEYS = [
  "own_tax", "fees", "hat_bazar", "ldt_1pct", "salary_grant", "adp", "block_grant", "food_programmes", "safety_net", "employment", "other_grant",
  "establishment", "roads", "health", "education", "agriculture", "water", "relief", "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type Kind = (typeof KINDS)[number];
export type Issuer = (typeof ISSUERS)[number];
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const DocumentRow = z.object({
  id: slug, title_bn: text, title_en: optText, issuer: z.enum(ISSUERS), date: optDate, fiscal_year: optFiscalYear,
  url: optText, archive_path: optText, reliability: z.enum(["official", "low", "observed"]), status: rowStatus, note_bn: optText,
});
export type DocumentRow = z.infer<typeof DocumentRow>;

export const DisclosureRow = z.object({
  id: slug, requirement_bn: text, requirement_en: text, legal_basis: text, fiscal_year: optFiscalYear,
  published: z.enum(["yes", "no", "partial"]), document_id: optText, rti_request_bn: text,
});
export type DisclosureRow = z.infer<typeof DisclosureRow>;

export const BudgetLine = z.object({
  union: slug, fiscal_year: fiscalYear, kind: z.enum(KINDS), direction: z.enum(["income", "expense"]), category: z.enum(CATEGORY_KEYS),
  head_bn: text, head_en: optText, amount, source_type: z.enum(SOURCE_TYPES), source_doc: slug, status: rowStatus,
});
export type BudgetLine = z.infer<typeof BudgetLine>;

export const ReportedTotal = z.object({
  union: slug, fiscal_year: fiscalYear, kind: z.enum(KINDS), direction: z.enum(["income", "expense"]), amount, source_doc: slug,
});
export type ReportedTotal = z.infer<typeof ReportedTotal>;

export const ProjectRow = z.object({
  id: slug, fiscal_year: optFiscalYear, name_bn: text, name_en: optText, scheme: z.enum(SCHEMES), ward: optWard, village_bn: optText,
  lat: optAmount, lng: optAmount, amount: optAmount, unit_of_work_bn: optText, implementer_bn: optText, start: optDate, end: optDate,
  status: z.enum(PROJECT_STATUSES), source_type: z.enum(SOURCE_TYPES), source_doc: slug, up_reply_bn: optText, status_row: rowStatus,
});
export type ProjectRow = z.infer<typeof ProjectRow>;

export const VerificationRow = z.object({
  project_id: slug, visit_date: isoDate, visitor: text, observed_status: z.enum(OBSERVED), observation_bn: text,
  photo_paths: z.preprocess((v) => (typeof v === "string" ? v.split(";").map((s) => s.trim()).filter(Boolean) : v ?? []), z.array(z.string())),
  measured: optText, status: rowStatus,
});
export type VerificationRow = z.infer<typeof VerificationRow>;

export const TenderRow = z.object({
  id: slug, title_bn: text, title_en: optText, issuer: text, ref_no: optText, published: optDate, deadline: optDate, est_value: optAmount,
  url: optText, archive_path: optText, awarded_to: optText, award_value: optAmount, project_id: optText, status: rowStatus,
});
export type TenderRow = z.infer<typeof TenderRow>;

export const ServiceFeeRow = z.object({
  id: slug, service_bn: text, service_en: text, official_fee: optAmount, time_limit_days: optAmount, legal_basis: text, source_doc: slug, note_bn: optText,
});
export type ServiceFeeRow = z.infer<typeof ServiceFeeRow>;

export const AllowanceRow = z.object({
  programme: slug, name_bn: text, name_en: text, fiscal_year: fiscalYear, monthly_amount: optAmount, payment_note_bn: optText,
  eligibility_bn: text, eligibility_en: text, selection_bn: text, selection_en: text, source_doc: slug,
});
export type AllowanceRow = z.infer<typeof AllowanceRow>;

export const AllowanceCountRow = z.object({
  programme: slug, fiscal_year: fiscalYear, ward: optWard, beneficiary_count: optAmount, source_type: z.enum(SOURCE_TYPES), source_doc: slug, status: rowStatus,
});
export type AllowanceCountRow = z.infer<typeof AllowanceCountRow>;

export const CONTACT_CATEGORIES = ["emergency", "health", "women_children", "legal", "agriculture", "govt_info", "utility", "local_office"] as const;
export const ContactRow = z.object({
  id: slug, category: z.enum(CONTACT_CATEGORIES), name_bn: text, name_en: text,
  number: z.string().trim().regex(/[0-9০-৯]/, "expected a phone number with digits"),
  hours_bn: optText, free: z.enum(["yes", "no", "unknown"]), note_bn: optText, source_doc: slug, status: rowStatus,
});
export type ContactRow = z.infer<typeof ContactRow>;

export const UnionProfile = z.object({
  id: slug, name_bn: text, name_en: text, upazila_bn: text, upazila_en: text, district_bn: text, district_en: text,
  area_km2: z.number(), population: z.number(), households: z.number(), census_year: z.number().int(), portal_url: z.string(),
  villages_bn: z.array(z.string()), villages_en: z.array(z.string()),
  wards: z.array(z.object({
    no: z.number().int().min(1).max(9), villages_bn: z.array(z.string()), villages_en: z.array(z.string()),
    member_bn: z.string().nullable(), member_verified_on: z.string().nullable(),
  })),
  leadership: z.array(z.object({
    role_bn: text, role_en: text, name_bn: text, name_en: text, verified_on: z.string().nullable(), note_bn: z.string().nullable(),
  })),
  maintainer: z.object({ whatsapp: z.string().nullable(), note_bn: z.string().nullable() }),
  comparisons: z.array(z.object({
    id: slug, name_bn: text, name_en: text, population: z.number().nullable(), households: z.number().nullable(),
    census_year: z.number().nullable(), portal_url: z.string().nullable(),
  })),
});
export type UnionProfile = z.infer<typeof UnionProfile>;

export type Dataset = {
  union: UnionProfile;
  documents: DocumentRow[];
  disclosures: DisclosureRow[];
  budget: BudgetLine[];
  reportedTotals: ReportedTotal[];
  projects: ProjectRow[];
  verifications: VerificationRow[];
  tenders: TenderRow[];
  fees: ServiceFeeRow[];
  allowances: AllowanceRow[];
  allowanceCounts: AllowanceCountRow[];
  contacts: ContactRow[];
};
