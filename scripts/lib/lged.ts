export type LgedRow = { tenderId: string; scheme: string; union: string; upazila: string; lat: number; lng: number; packageNo: string; closing: string };

const dmy = (s: string) => {
  const [d, m, y] = s.split("-");
  return `${y}-${m}-${d}`;
};

const ROW = /(\d{6,8})\s+(.+?)\s+Under\s+(.+?)\s+Union,\s*Upazila:\s*(.+?),\s*District:\s*\w+\.?\s*\[Latitude:\s*([\d.]+),\s*Longitude:\s*([\d.]+)\]\s*(\S+)\s+\d{2}-\d{2}-\d{4}\s*&\s*[\d.:]+\s*[ap]m\s+(\d{2}-\d{2}-\d{4})/gi;

export function parseLgedNotice(raw: string): { noticeNo: string | null; date: string | null; rows: LgedRow[] } {
  const text = raw.replace(/\s+/g, " ");
  const rows: LgedRow[] = [];
  for (const m of text.matchAll(ROW)) {
    rows.push({ tenderId: m[1], scheme: m[2].replace(/^\d+\.\s*/, "").trim(), union: m[3].trim(), upazila: m[4].trim(), lat: Number(m[5]), lng: Number(m[6]), packageNo: m[7], closing: dmy(m[8]) });
  }
  const date = text.match(/Memo No\.[^D]*Date:\s*(\d{2}-\d{2}-\d{4})/i)?.[1];
  return { noticeNo: text.match(/Notice No\.?\s*([\d/-]+)/i)?.[1] ?? null, date: date ? dmy(date) : null, rows };
}

export function lgedRows(text: string, target: { union: string; upazila: string }): LgedRow[] {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return parseLgedNotice(text).rows.filter((r) => norm(r.union) === norm(target.union) && norm(r.upazila) === norm(target.upazila));
}

const fyOf = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  const start = m >= 7 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

export function lgedRecords(text: string, target: { union: string; upazila: string }, url: string, archivePath: string) {
  const notice = parseLgedNotice(text);
  const rows = lgedRows(text, target);
  if (rows.length === 0 || !notice.noticeNo) return { document: null, tenders: [], projects: [] };
  const docId = `lged-notice-${notice.noticeNo.replace(/\//g, "-")}`;
  const fy = notice.date ? fyOf(notice.date) : "";
  return {
    document: {
      id: docId, title_bn: `এলজিইডি টাঙ্গাইল — ই-টেন্ডার বিজ্ঞপ্তি নং ${notice.noticeNo}`, title_en: `LGED Tangail e-Tender Notice ${notice.noticeNo}`,
      issuer: "district", date: notice.date ?? "", fiscal_year: fy, url, archive_path: archivePath, reliability: "official", status: "published",
      note_bn: "স্বয়ংক্রিয়ভাবে যোগ করা: নোটিশের যে প্যাকেজে ইউনিয়ন ও উপজেলার নাম মিলেছে শুধু সেগুলোই নেওয়া হয়েছে।",
    },
    tenders: rows.map((r) => ({
      id: `lged-tender-${r.tenderId}`, title_bn: `${r.scheme}, ${target.union} Union — এলজিইডি ই-টেন্ডার ${notice.noticeNo}`, title_en: `${r.scheme}, ${target.union} Union`,
      issuer: "এলজিইডি, টাঙ্গাইল", ref_no: `e-GP ID ${r.tenderId} · ${r.packageNo}`, published: notice.date ?? "", deadline: r.closing, est_value: "",
      url, archive_path: archivePath, awarded_to: "", award_value: "", project_id: `lged-${r.tenderId}`, status: "published",
    })),
    projects: rows.map((r) => ({
      id: `lged-${r.tenderId}`, fiscal_year: fy, name_bn: `${r.scheme} (এলজিইডি)`, name_en: r.scheme, scheme: "other", ward: "", village_bn: "",
      lat: String(r.lat), lng: String(r.lng), amount: "", unit_of_work_bn: "", implementer_bn: "", start: "", end: "", status: "planned",
      source_type: "upstream", source_doc: docId, up_reply_bn: "", status_row: "published",
    })),
  };
}
