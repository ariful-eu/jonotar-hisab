export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/** Red-cell compatibility: can a donor of `donor` give to a patient of `recipient`? */
export function canDonateTo(donor: BloodGroup, recipient: BloodGroup): boolean {
  const abo = (g: BloodGroup) => g.slice(0, -1);
  const d = abo(donor);
  const r = abo(recipient);
  const aboOk = d === "O" || r === "AB" || d === r;
  const rhOk = donor.endsWith("-") || recipient.endsWith("+");
  return aboOk && rhOk;
}

export const canReceiveFrom = (recipient: BloodGroup) => BLOOD_GROUPS.filter((d) => canDonateTo(d, recipient));
export const canGiveTo = (donor: BloodGroup) => BLOOD_GROUPS.filter((r) => canDonateTo(donor, r));

/** Accepts "A+", "a +", "AB−", "O neg", "এ+", "বি-", "এবি+", "ও-". */
export function normalizeGroup(raw: string): BloodGroup | null {
  let s = raw.normalize("NFC").trim().toUpperCase().replace(/\s+/g, "");
  s = s.replace(/[−–—]/g, "-").replace(/POS(ITIVE)?$/, "+").replace(/NEG(ATIVE)?$/, "-");
  s = s.replace(/^এবি/, "AB").replace(/^এ/, "A").replace(/^বি/, "B").replace(/^ও/, "O");
  s = s.replace(/পজিটিভ$/, "+").replace(/নেগেটিভ$/, "-");
  return (BLOOD_GROUPS as readonly string[]).includes(s) ? (s as BloodGroup) : null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

const YES = new Set(["yes", "y", "true", "1", "হ্যাঁ", "হ্যা", "আছে"]);
const NO = new Set(["no", "n", "false", "0", "না", "নেই"]);

export type GroupAvailability = Record<BloodGroup, boolean | null>;

/**
 * Parses the owner's published `public_groups` sheet tab. Only the `group` and `available`
 * columns are read; every other column is ignored, so a personal column can never reach the page.
 * Groups that are missing or unclear stay null ("unknown").
 */
export function parseGroupsCsv(text: string): GroupAvailability {
  const result = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, null])) as GroupAvailability;
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return result;
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const gi = header.indexOf("group");
  const ai = header.indexOf("available");
  if (gi < 0 || ai < 0) return result;
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const group = normalizeGroup(cells[gi] ?? "");
    const v = (cells[ai] ?? "").toLowerCase();
    if (!group) continue;
    if (YES.has(v)) result[group] = true;
    else if (NO.has(v)) result[group] = false;
  }
  return result;
}

/** Display form with a real minus sign. Latin letters are kept: they are what blood bags and reports use. */
export const groupLabel = (g: BloodGroup) => g.replace("-", "−");
