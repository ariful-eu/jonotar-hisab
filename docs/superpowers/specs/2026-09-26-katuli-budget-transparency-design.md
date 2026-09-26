# Katuli Union Budget Transparency Site — Design Spec

Date: 2026-09-26 · Status: awaiting review

## 1. Purpose

An independent, citizen-run website that lets residents of **Katuli Union (কাতুলী ইউনিয়ন), Tangail Sadar, Tangail** see:
- where the Union Parishad's money comes from and where it goes
- what they are personally entitled to
- how to verify spending and use their rights

The goals are to reduce corruption and raise rights awareness.

**Success criteria**
- A resident on a cheap Android phone over 3G understands "how much came to Katuli and roughly how much per family" within 10 seconds of opening the home page.
- Every figure shows its source and date.
- Every missing required document has a one-tap, pre-filled RTI request.
- The maintainer can add a year of data by editing CSV files, with no code changes.

## 2. Constraints & principles

- **Independent, not official.**
  - Every page carries a notice: "স্বাধীন নাগরিক উদ্যোগ — সরকারি ওয়েবসাইট নয়" ("Independent citizens' initiative — not a government website").
  - No government seal, no national-portal styling, no `.gov.bd` look-alike domain.
- **Legally cautious wording.**
  - Never name individuals as wrongdoers. Never use words like "চুরি" (theft) or "দুর্নীতি" (corruption) about specific people or projects.
  - Discrepancies are shown as "published figure vs. what we observed on [date]", with photos.
  - The About page carries a disclaimer: "a discrepancy is not proof of wrongdoing".
  - The UP gets a right-of-reply field on every project.
- **Privacy.**
  - Never publish beneficiary names, NIDs, phone numbers or photos. Allowance data is counts per ward only.
  - Complaints are never published by the site. Reporting goes to official channels or to the maintainer's WhatsApp.
- **Audience.**
  - Rural, Bangla-first readers (English toggle), some with low literacy.
  - Cheap Android phones, patchy 3G, shared phones.
- **Performance budget.** First load ≤ 200 KB (HTML + CSS + JS + font), excluding images.
- **Numbers.**
  - Bangla digits with lakh/crore grouping (`Intl.NumberFormat('bn-BD')`), e.g. "৳১২.৩ লাখ". Never "1.23M".
  - Every total also shows a per-household figure.

## 3. Architecture

- **Stack.**
  - React + TypeScript + Vite.
  - React Router v7 in framework mode with `ssr: false` and `prerender` covering every route. Each URL is emitted as static HTML with its own Bangla `<title>` and `og:*` tags, then hydrated as a SPA.
- **No chart library.** Bars and comparisons are hand-built SVG/CSS components.
- **Offline.** `vite-plugin-pwa` precaches the app shell and the data for the current year.
- **Font.** Noto Sans Bengali, one self-hosted regular woff2 (~44 KB), `font-display: swap`, with `local()` tried first.
- **QR codes.** Generated at build time as inline SVG (`qrcode` package).
- **Print.** A `@media print` stylesheet, plus dedicated `/poster/...` routes laid out for A4.
- **Hosting.** GitHub Pages, deployed by a GitHub Actions workflow on every push to `main`.
- **i18n.** UI strings live in `src/i18n/bn.ts` and `src/i18n/en.ts`. Data rows carry `*_bn` and `*_en` columns. The language choice is stored in `localStorage` (wrapped in try/catch) and defaults to Bangla.

### 3.1 Data pipeline

```
data/*.csv, data/union.json ──(build: parse + zod validate)──> typed data module ──> prerendered pages
                  ▲
scraper (daily GH Action) ──> archive/ + draft rows ──> Pull Request ──(maintainer reviews, merges)──> redeploy
```

- **Build-time loading.** A loader reads the CSVs with `papaparse` and validates each row with a `zod` schema. If a row fails, the build fails with a message such as `data/projects.csv row 14, column amount: expected number, got "৪০,০০০"`. Bangla digits are accepted in numeric columns and normalised.
- **Cross-file checks.**
  - Every `source_doc` must exist in `documents.csv`.
  - Every `ward` must be between 1 and 9.
  - Every `project_id` referenced in `verifications.csv` or `tenders.csv` must exist.

### 3.2 Scraper (no AI)

- Runs as a Node script `scripts/scrape.ts`, triggered by a GitHub Action on a daily cron. It can also be run manually.
- **Sources.**
  - The sections of Katuli's national-portal page: notices, tenders, files, budget and projects.
  - Any upstream pages that the research found scrapeable without login or JavaScript, such as the upazila portal's notices, tenders and files sections, and public e-GP or LGED tender listings.
  - Sources are configured in `scripts/sources.json`, so adding one is a config change, not a code change.
- **What it does on each run.**
  - Fetches each source and finds items not already in `data/documents.csv`, matching on URL or content hash.
  - Downloads the files into `archive/YYYY/` and appends draft rows to `documents.csv` with `status=draft`.
  - For tender listings that can be parsed, it also appends draft rows to `tenders.csv`.
  - Opens a PR titled "নতুন নথি: N টি" ("New documents: N") that lists every item with its source link.
  - If nothing is new, it does not open a PR.
- **Draft rows stay off the site.** The build ignores rows with `status=draft`. The maintainer fills in any figures, sets `status=published`, and merges.

## 4. Data model (`data/`)

| File | Key columns |
|---|---|
| `union.json` | name_bn/en, area_km2, population, households, census_year, wards[{no, villages_bn[], villages_en[], member_bn (nullable), member_verified_on}], leadership[{role, name_bn, verified_on, note}], upazila, district |
| `documents.csv` | id, title_bn, title_en, issuer (union/upazila/district/ministry/volunteer), date, fiscal_year, url, archive_path, reliability (official/low/observed), status (draft/published), note_bn |
| `disclosures.csv` | id, requirement_bn/en, legal_basis (e.g. "UP Act 2009 s.57"), fiscal_year, published (yes/no/partial), document_id (nullable), rti_template_key |
| `budget_lines.csv` | union (katuli/silimpur/…), fiscal_year, kind (proposed/revised/actual), direction (income/expense), category (standard key, e.g. `own_tax`, `ldt_1pct`, `adp`, `lgsp`, `food_programmes`, `safety_net`, `roads`, `health`, `education`, `agriculture`, `establishment`, `other`), head_bn, head_en, amount, source_type (union/upstream/observed), source_doc, status |
| `projects.csv` | id, fiscal_year, name_bn/en, scheme (ADP/LGSP/TR/KABITA/KABIKHA/EGPP/GR/other), ward, village, lat, lng (nullable), amount, unit_of_work (e.g. "400 m road"), pic_chair_or_contractor, start, end, status (planned/ongoing/completed/unknown), source_type, source_doc, up_reply_bn (nullable), status_row |
| `verifications.csv` | project_id, visit_date, visitor (initials or "volunteer"), observed_status, observation_bn, photo_paths (semicolon-separated), measured (nullable) |
| `tenders.csv` | id, title_bn, issuer, ref_no, published, deadline, est_value (nullable), url, archive_path, awarded_to (nullable), award_value (nullable), project_id (nullable), status (draft/published) |
| `service_fees.csv` | service_bn/en, official_fee, time_limit_days, legal_basis, source_doc |
| `allowances.csv` | programme (old_age/widow/disability/vgd/vgf/mother_child/…), fiscal_year, monthly_amount, eligibility_bn/en, selection_bn/en, ward (nullable = union total), beneficiary_count (nullable = unknown), source_type, source_doc |

**Seed content for v1**
- **Katuli FY2014-15 budget:** included with `reliability=low`. The page shows a warning that the source document looks copied from a template.
- **Katuli's upstream figures:** allocations found in upazila, district and LGD lists are added as `source_type=upstream`.
- **Comparison unions:** Silimpur FY2023-24, plus any neighbouring unions whose budgets the research found, go in as comparison rows.
- **Projects:** the 9 projects listed on the portal, with `status=unknown`.
- **Union profile:** 26.92 km²; 29,811 people and 6,433 households (2011 census, replaced by 2022 figures if found); 9 wards; 24 villages. Leadership is marked unverified with an "as of" date.
- **Rights content:** RTI procedure, ward shava, open budget meeting, service fees, allowance amounts and complaint channels. These facts come from the rights/law research, and every fact carries a citation in `documents.csv`.
- **Disclosure scorecard:** at minimum, the current-year budget, open budget meeting minutes, ward shava minutes, citizen charter, tax schedule, project list, allowance beneficiary counts, and tender notices.

## 5. Pages & routes

All routes are prerendered. Each has a Bangla title and description, a share button (WhatsApp deep link plus the Web Share API), and a print style.

| Route | Content |
|---|---|
| `/` | Hero: total money this year plus ৳ per household. Income and expense bars with icons. A disclosure scorecard strip ("৮টির মধ্যে ১টি প্রকাশিত" = "1 of 8 published") with an RTI button. Tiles linking to every section. Data freshness date. |
| `/budget/:year?` | Year switcher. Income and expense categories as tappable bars; expanding one shows its line items with source badges (union / upstream / observed) and a reliability warning where it applies. Per-household figure. "Compare with neighbours" chart of per-household totals by union. |
| `/wards`, `/ward/:no` | Villages, member (unverified), projects in the ward, allowance counts, how to attend the ward shava. Poster link. |
| `/projects`, `/projects/:id` | Filter by ward, scheme, status and year. The detail page shows facts, a verification timeline with photos, the UP's reply, "report what you see" (pre-filled WhatsApp to the maintainer, plus GRS/333 links), and a poster link. |
| `/tenders`, `/tenders/:id` | Open tenders (sorted by deadline) and closed ones. Links to the archived notice and to the linked project. |
| `/services` | Official fee and time limit for each service, plus "asked to pay more? complain here". |
| `/allowances` | One card per programme: who qualifies, amount, how people are selected, counts per ward (or "unknown — request via RTI"). |
| `/rights`, `/rights/:topic` | Topics: `rti`, `ward-shava`, `open-budget`, `complain`. Step-by-step illustrated cards. The RTI page generates a pre-filled printable request (Form ক) for any disclosure item. |
| `/documents` | Full scorecard plus the document archive, filterable by issuer and year. |
| `/about` | Who runs the site, independence statement, methodology, source types, disclaimer, right of reply, how to contribute. |
| `/poster/:kind/:id` | A4 print layouts for the home summary, a ward, or a project, with QR code, large type and minimal ink. |

**Visual style**
- Warm, trustworthy palette: deep teal plus a warm sand accent. It must not look like the government portal.
- Base text size 18px. One idea per screen section.
- Every category has an icon (inline SVG).
- Light and dark themes, with a light print version.

## 6. Error & empty states

- **No data for a year:** show "এই বছরের তথ্য প্রকাশিত হয়নি" ("Data for this year has not been published") plus an RTI button, rather than an empty chart.
- **Unknown values** (count, amount, member): show "অজানা" ("unknown") with a tooltip explaining how to request it. Never show 0.
- **Offline:** cached pages still work. Uncached pages show an offline notice that lists which pages are saved.

## 7. Testing

- **Unit tests (Vitest):**
  - Bangla number formatting (lakh/crore, Bangla digits).
  - Bangla-digit parsing.
  - Per-household maths.
  - Category aggregation.
  - Zod schemas: good rows pass; bad rows fail with the right row and column.
  - Cross-file reference checks.
  - The scraper's diffing logic, run against saved HTML fixtures.
- **Component tests** (Vitest + Testing Library): budget bars, the disclosure strip, the RTI form generator, and empty/unknown states.
- **Build test:** CI runs `build`. The test fails if any route is missing from the prerender output, or if the first-load JS + CSS for `/` exceeds the budget.
- **Manual:**
  - The browser pane at 375 px width, in both themes.
  - Print preview of the posters.
  - Bangla conjunct rendering (ক্ষ, জ্ঞ, ন্ত্র, র‍্য).
  - Offline reload.

## 8. Out of scope (v2 candidates)

- A backend complaint/observation intake with moderation.
- A public follow-up tracker.
- Volunteer photo upload with GPS.
- IVR/audio for readers who cannot read.
- AI extraction of scanned documents.
- Automatic merging of scraper PRs.
- Accounts or logins of any kind.
