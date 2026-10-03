# জনতার হিসাব (Jonotar Hisab): project handbook for agents and contributors

Read this before changing anything. It explains what the project is, how it is built, the rules that must not be broken, where the data comes from, what is automated, and the traps that have already cost time. Last updated 2026-10-03.

---

## 1. What this is

**জনতার হিসাব** ("The People's Account") is an independent, citizen-run budget-transparency website for **Katuli Union Parishad (কাতুলী ইউনিয়ন), Tangail Sadar Upazila, Tangail, Bangladesh**.

It shows residents:
- where the union's money comes from and where it goes
- development works and tenders
- official service fees and safety-net allowances
- which legally required documents the union has not published

It also teaches residents their rights: RTI, the ward shava, the open budget session, and complaint channels. The goals are access to information, less corruption, and rights awareness.

| | |
|---|---|
| Live site | https://ariful-eu.github.io/jonotar-hisab/ |
| Repo | https://github.com/ariful-eu/jonotar-hisab (`main` deploys automatically) |
| Owner | An independent citizen volunteer (GitHub `ariful-eu`), not affiliated with the UP or the government |
| Credit (footer) | "Designed and Developed with ❤️ in Torapganj, Tangail by Miah Softwares" → https://miah-softwares-site.trendy-outfit.workers.dev/ |
| Audience | Rural, Bangla-first, mostly on cheap Android phones over patchy 3G, some with low literacy. An English toggle exists. |
| Original design docs | `docs/superpowers/specs/2026-09-26-katuli-budget-transparency-design.md` and `docs/superpowers/plans/2026-09-26-katuli-budget-transparency.md`. These are historical; this handbook reflects the current state. |
| Research notes | `docs/research/katuli-data.md`, `rights-law.md`, `civic-tech.md` |

---

## 2. Non-negotiable rules

Every change must respect these. Most of them exist for legal-safety or privacy reasons.

1. **Independent, never official-looking.** Every page shows "স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি ওয়েবসাইট নয়" ("Independent citizens' initiative — not a government website"). Never use the government seal, the national-portal look, or a `.gov.bd`-style domain.
2. **Neutral wording, no accusations.**
   - Never call a person or project corrupt (দুর্নীতি) or a thief (চুরি).
   - Show "what the document says" and "what a volunteer saw on [date]", nothing more.
   - Bangladesh's cyber-security law carries prison terms for "unverified" or derogatory content, so this matters.
   - The disclaimer "কোনো অমিল মানেই অনিয়মের প্রমাণ নয়" ("a discrepancy is not proof of wrongdoing") and a right of reply for the UP must stay.
3. **Privacy.**
   - Never publish names, NIDs, phone numbers or photos of allowance or relief beneficiaries. Publish counts only.
   - Don't republish personal records, such as a staff member's leave order. These are marked `ignored`.
   - The RTI form keeps the user's details on their own device and never sends them anywhere.
4. **Every figure has a source.** Every data row points to a `documents.csv` row through `source_doc`. Keep an archived copy under `public/archive/` when the file is small enough, so the evidence survives if the portal deletes it.
5. **Unknown means "তথ্য নেই", never 0.** A missing value is `null` and renders as the `Unknown` chip ("তথ্য নেই · তথ্য চান"). Never default a missing number to 0.
6. **Nothing machine-read reaches the site without human review, except** LGED tenders that are verified row by row as "Katuli Union, Upazila: Tangail Sadar" (see §7). AI-extracted budget rows are always `draft`.
7. **Honest headlines.** The home and poster headline uses the latest budget the union itself published (currently FY2014-15), and warns how old it is. Partial figures from other offices are shown separately and labelled "অন্তত" ("at least") and "আংশিক" ("partial"). Never present a partial or upstream figure as the union's budget, and never present a plan as a budget.
8. **Naming.**
   - Always write "X ইউনিয়ন" / "X Union" ("কাতুলী ইউনিয়নের বাজেট"), never the bare place name.
   - Use "বাজেট" (budget), not "আয়" (income), for totals.
   - The per-household figure is "পরিবারপ্রতি বাজেট" (budget per household), not "প্রতি পরিবারে আয়" (income per household).

---

## 3. Quick start

```bash
npm ci
npm run dev            # http://localhost:5173 (dev server; config in .claude/launch.json as "dev")
npm test               # vitest: 78 tests; also validates every real CSV row in data/
npm run typecheck      # react-router typegen && tsc
npm run build          # prerender all routes to build/client, then scripts/postbuild.ts
npm run check:size     # fails if first-load JS+CSS (gzip) + Bengali font > 200 KB (currently ~174 KB)
npm run scrape         # daily checker (normally runs in GitHub Actions); writes drafts/auto rows
npm run extract-budget -- <document-id> [fiscal-year-hint]   # AI-read a scanned budget (needs ANTHROPIC_API_KEY)
```

To build exactly as GitHub Pages does:
```bash
BASE_PATH=/jonotar-hisab/ VITE_SITE_URL=https://ariful-eu.github.io npm run build
```

Node 24+ is used in CI; the project was developed on Node 26. `npm` warns about install scripts being blocked (esbuild, fsevents). That warning is harmless.

**Before every commit, run:** `npm test && npm run typecheck && npm run build && npm run check:size`. CI runs the same checks and will not deploy on failure.

---

## 4. Architecture

- **Stack:**
  - React 19 + TypeScript, built with Vite 7.
  - React Router v7.18 in framework mode with `ssr: false` and `prerender` covering **every** route (`react-router.config.ts` calls `allPaths(loadDataset())`).
  - zod 4, papaparse, lucide-react icons, qrcode, the Noto Sans Bengali font (one 400 weight, self-hosted, `local()` first).
- **Build-time data only.** Route `loader`s run **only during prerender** (in Node). They call `loadDataset()` from `app/data/load.server.ts`, which reads and validates the CSVs. Each page ships as static HTML plus a small `.data` file. There is no backend.
- **Language.**
  - UI copy is written inline as `t("বাংলা", "English")` (`useT()`), and numbers/dates go through `useFmt()`; both live in `app/lib/i18n.tsx`.
  - Pages are prerendered in Bangla. The English choice is stored in `localStorage` (`katuli-lang`, wrapped in try/catch) and applied after hydration.
  - Anything that differs between server and client (current date, `window.location`, `navigator.share`, `localStorage`) must be set in `useEffect`, or it causes a hydration mismatch (React error #418).
- **Offline.** `scripts/postbuild.ts` (template in `scripts/lib/sw-template.ts`) writes `sw.js`. It precaches the app shell and key pages, uses network-first for navigations and `.data` files, and cache-first for assets. It also writes `404.html` (SPA fallback) and `.nojekyll`.
- **Hosting.** GitHub Pages at the sub-path `/jonotar-hisab/` (`BASE_PATH`). `VITE_SITE_URL` (an origin) is used for absolute URLs in poster QR codes.

```
data/*.csv + union.json ──(build: papaparse + zod + cross-file checks)──► loadDataset() ──► route loaders ──► prerendered HTML/.data ──► GitHub Pages
        ▲                                                                                                               ▲
GitHub Action "Check for new documents" (daily 06:30 BDT)                                                     GitHub Action "Deploy site" (push to main)
   ├─ LGED tenders verified per row  ──► data/*_auto.csv, committed straight to main ──► triggers deploy
   └─ everything else (+ optional AI budget drafts) ──► Pull Request "নতুন নথি পাওয়া গেছে — যাচাই করুন" (human review)
```

---

## 5. Repository map

| Path | What it is |
|---|---|
| `app/root.tsx` | HTML shell, `LangProvider`, header, footer, bottom nav, offline notice, SW registration, error boundary |
| `app/routes.ts` | Route table. **`projects/:id` and `tenders/:id` are registered only when records exist** (see §10). |
| `app/routes/*.tsx` | Pages: `home`, `budget` (`/budget/:year?`), `wards`, `ward/:no`, `projects`, `project`, `tenders`, `tender`, `services`, `allowances`, `rights`, `rights-topic` (`/rights/:topic`, where `rti` has the letter generator), `documents`, `about`, `poster/:kind/:id` (A4 + QR) |
| `app/components/` | Shared UI: `Header` (logo + desktop top nav + language toggle), `BottomNav` (exports `NAV_ITEMS`, phones only), `Footer`, `SectionTiles` (the "কী জানতে চান?" menu, `SECTIONS`, featured `tone`s), `Bars` (CSS bar chart, optional shared `max`), `Amount`, `Unknown`, `SourceBadge` (+ `docHref`), `DisclosureStrip` (scorecard), `ShareButtons` (WhatsApp/Facebook/Messenger/copy link/native share/poster), `DeadlineBadge`, `RtiForm`, `StatusIcon`, `OfflineNotice`, `Logo` |
| `app/data/schemas.ts` | **Source of truth for every data column, enum and type.** Read it before touching data. |
| `app/data/load.server.ts` | `parseCsv`, `checkRefs`, `loadDataset` (merges `*_auto.csv`; caches only when `NODE_ENV=production`) |
| `app/data/categories.ts` | Budget category labels and icons, `categoryItems()` |
| `app/data/paths.ts` | `allPaths(ds)`, the prerender list |
| `app/data/refs.ts` | `DocRef`, `docRefs()` |
| `app/lib/format.ts` | Bangla digits, `parseAmount` (accepts `৳`, `টাকা`, commas, Bangla digits, `/-`, leading `=`), `formatTaka` (lakh/crore), `formatTakaFull`, `formatDate`, `perHousehold` |
| `app/lib/aggregate.ts` | `yearsFor`, `summarizeYear` (prefers actual > revised > proposed), `compareUnions` (each union's latest **own** budget year), `headlineYear` (latest own budget + newer partial years), `fiscalYearOf` (July starts the FY) |
| `app/lib/labels.ts` | bn/en labels for enums (kind, scheme, status, source type, issuer, observed) |
| `app/lib/rti.ts` | `buildRtiLetter()`. The printed letter is always in Bangla (Form ক). |
| `app/content/rights.ts` | The four rights guides (`rti`, `ward-shava`, `open-budget`, `complain`), with section numbers from the laws |
| `app/app.css` | All styling: design tokens on `:root` with a dark-mode override, components, `@media print`, responsive rules |
| `data/` | All content; see §6. `data/README.md` is the maintainer's editing guide. |
| `public/archive/` | Archived source documents (`research/` from the initial research, `lged/` auto-ingested, `<year>/` from the scraper) |
| `public/icon.svg`, `icon-192/512.png`, `apple-touch-icon.png`, `manifest.webmanifest` | Logo and PWA icons |
| `scripts/scrape.ts` | Daily checker (see §7). `scripts/sources.json` lists the sources. |
| `scripts/lib/scrape-core.ts` | `extractLinks` (falls back to table-row text when the link text is generic, e.g. "দেখুন"), `appendRows`, `knownUrls`, draft-row builders |
| `scripts/lib/lged.ts`, `lged-ingest.ts` | LGED tender PDF parser and auto-publisher; `banglaScheme()` translates scheme names to Bangla |
| `scripts/lib/extract-budget.ts`, `scripts/extract-budget.ts` | AI reading of scanned budgets (draft rows only) |
| `scripts/certs/sectigo-dv-r36.pem` | Missing TLS intermediate for gov.bd portals (see §10) |
| `scripts/postbuild.ts`, `check-size.ts` | Output flattening, service worker, 404 page, size budget |
| `.github/workflows/deploy.yml` | Test → build → size check → GitHub Pages, on every push to `main` |
| `.github/workflows/scrape.yml` | Daily checker, LGED auto-publish to `main`, PR for everything else |
| `tests/` | Vitest + jsdom + Testing Library. `tests/setup.ts` adds RTL cleanup (needed because vitest globals are off). `tests/data.test.ts` validates the real `data/` folder. |
| `docs/research/` | What was searched, found and not found, with URLs |

---

## 6. Data model (`data/`)

Edit the CSVs in Excel, LibreOffice or Sheets and save as **CSV UTF-8**. A BOM is fine. Column definitions live in `app/data/schemas.ts`. A bad row fails `npm test` and the build with a message like `projects.csv row 14, column amount: … (got "abc")`.

| File | Holds | Notes |
|---|---|---|
| `union.json` | Union profile | Census 2022: 32,540 people and 7,884 households. 9 wards; the village↔ward mapping is unknown. 24 villages in bn/en (their bn names drive the LGED name translation). Leadership is unverified. `maintainer.whatsapp` is null, which hides the report button. `comparisons[]` lists 6 neighbour unions with 2022 household counts. |
| `documents.csv` (+ `documents_auto.csv`) | Every source document | `issuer`: union/upazila/district/ministry/volunteer/other. `reliability`: `official`, `low` (the Katuli 2014-15 budget is `low` because it shows two meeting dates and two chairs, probably copied from a template) or `observed`. `status`: `published`, `draft` or `ignored`. |
| `disclosures.csv` | Scorecard of 10 legally required disclosures | All `published=no` today ("১০টির মধ্যে প্রকাশ করেছে ০টি", i.e. 0 of 10 published). `rti_request_bn` is the exact text inserted into the RTI letter. |
| `budget_lines.csv` | One row per **leaf** budget line, never subtotals | `union` is `katuli` or a comparison id. `kind`: proposed/revised/actual. `direction`: income/expense. `category`: one of `CATEGORY_KEYS`. `source_type`: `union`, `upstream` (another office's list) or `observed`. |
| `budget_reported_totals.csv` | Totals as printed in each document | The budget page shows a note when the line items don't add up to these. Comparisons use them. |
| `projects.csv` (+ `projects_auto.csv`) | Development works | `scheme` adds `lged`. `status`: planned/ongoing/completed/unknown. `status_row` is the draft flag here (not `status`). |
| `verifications.csv` | Volunteer site visits (date, observed status, photos under `public/photos/`) | Empty so far |
| `tenders.csv` (+ `tenders_auto.csv`) | Tenders | All 6 current ones are auto LGED rows |
| `service_fees.csv` | Official fees | Birth/death registration fees come from orgbdr.gov.bd. Trade licence, citizenship and heir certificates are unknown because Katuli has no published citizen charter. |
| `allowances.csv`, `allowance_counts.csv` | FY2026-27 rates: old age ৳700, widow ৳700, disability ৳1,000, mother & child ৳850, VWB rice (amount being verified). Counts: union totals from DSS 2020-21 (825 / 159 / 373). | No per-ward counts exist. |

**Statuses.** `draft` rows (in `projects.csv` the column is `status_row`) and `ignored` rows are skipped by the loader. `ignored` means "reviewed, not relevant"; the row is kept so the scraper never fetches that URL again.

**Auto files (`*_auto.csv`).** These are written only by the LGED ingester and merged by the loader. Don't hand-edit them unless you're correcting the ingester's output.

**Cross-file checks (`checkRefs`):**
- every `source_doc` exists in documents
- budget unions are `katuli` or listed in `comparisons`
- verifications and tenders point to real projects
- ids are unique

### What the data currently says (2026-10-03)

**Katuli's own budget: FY2014-15 only.**
- Full line items for 2014-15 proposed, 2013-14 revised and 2012-13 actual.
- Stated total income ৳৯৪,৫৮,০৫৮; the line items add up exactly.
- **No newer Katuli budget exists publicly.** A thorough search on 2026-09-27 covered the Katuli portal (all 115 pages), the upazila portal (including 8 upazila budget PDFs), the district portal, DDLG (offline), LGD, news, Facebook/YouTube and archives. Details are in `docs/research/katuli-data.md`.
- The only route to the current budget is an RTI request to the UP Secretary or the UNO (UP Act s.57(4) says the UNO holds copies).

**Upstream figures for Katuli (`source_type=upstream`):**
- LGD UP-development-grant instalments: 2024-25 ৳7,43,700 (2nd instalment); 2025-26 ৳7,41,100 (2nd instalment); 2026-27 ৳3,91,300 (1st instalment).
- These appear as "later years: at least …", never as the budget.

**Projects (17 manual + 6 auto):**
- the old Katuli portal list, which has few amounts
- FY2012-13 KABIKHA and EGPP works from an old upazila page, including a road repair for ৳42,00,000 with 60 workers
- 6 LGED GSID-2 mosque and graveyard works with GPS coordinates and closing dates

**Neighbour comparisons (latest own budgets):**

| Union | FY | Total |
|---|---|---|
| Silimpur | 2023-24 | ৳1.84 cr |
| Porabari | 2025-26 | ৳1.72 cr |
| Baghil | 2026-27 | ৳2.59 cr |
| Karatia | 2024-25 | ৳2.25 cr (low reliability) |
| Hugra | 2023-24 | ৳1.74 cr (low reliability) |
| Dainya | 2023-24 | ৳1.54 cr |

**Reference only (not a budget):** Katuli's five-year plan 2011-16, which planned ৳1.05 cr of development works for FY2015-16.

---

## 7. Automation: what runs by itself and what needs a human

| What | When | Human needed? |
|---|---|---|
| Deploy (`deploy.yml`) | Every push to `main` | No. Tests, build and the size check must pass. |
| Daily checker (`scrape.yml` → `npm run scrape`) | 00:30 UTC (06:30 BDT), or manually | See below |
| LGED Tangail tenders | Part of the daily checker | **No.** Auto-published, committed to `main`, and redeploy triggered. |
| Other new documents (union/upazila/district notices, files, tenders) | Part of the daily checker | **Yes.** It opens or updates a PR with `draft` rows; a human reviews and merges. |
| AI budget reading | Part of the daily checker **only if** the `ANTHROPIC_API_KEY` secret is set, and only for documents whose title or URL contains বাজেট/budget | **Yes.** Rows are always `draft` in the same PR. |
| Typing a new budget into the CSVs | When one is obtained (for example via RTI) | Yes, or run `extract-budget` and review its output |
| Volunteer site visits | Whenever they happen | Yes (`verifications.csv` + photos) |

**Scraper details (`scripts/scrape.ts`, sources in `scripts/sources.json`):**
- **Sources:** `katuli-notices`, `katuli-files`, `katuli-tenders`, `katuli-projects`, `sadar-notices`, `sadar-office-orders`, `sadar-tenders`, `district-notices`, `lged-tangail-tenders`.
- **List URLs.** gov.bd "pages/" portals are server-rendered and accept `?page_size=100&archived=true&search=<urlencoded>`. `archived=true` is essential.
- **Deduplication.** Known URLs are those already in `documents.csv`, `tenders.csv` and `documents_auto.csv`. `.scrape-cache/seen.json` records LGED PDFs already read; it's kept in the Actions cache and gitignored.
- **What it writes.** New files are archived to `public/archive/<year>/`, rows are appended with `status=draft`, and the PR body comes from `scrape-summary.md`.
- **Failures.** A source that fails is logged and skipped. The run exits 1 only if **every** source fails.

**LGED auto-publish rules (`scripts/lib/lged.ts`):**
- The scraper downloads each new PDF from the LGED Tangail tender list and extracts its text with `unpdf`.
- It parses rows of the form `<TenderID> <scheme> Under <X> Union, Upazila: <Y>, District:… [Latitude:…, Longitude:…] <package> <last-sale date> & <time> <closing date>`.
- A row is published **only if the union is "Katuli" and the upazila is "Tangail Sadar"**. Each match creates:
  - one `lged-notice-<no>` document
  - one `lged-tender-<tenderId>` tender, with deadline = closing date
  - one `lged-<tenderId>` project, with scheme `lged`, GPS coordinates, and a Bangla name built by `banglaScheme()` with village names taken from `union.json`
- If a PDF mentions Katuli and Tangail Sadar but no row parses, it falls back to a draft document row for review.
- The regex was fixed once already: a preceding row without "Union" used to make it skip the next package. There's a test for that.

**AI extraction (`npm run extract-budget -- <doc-id> [fy]`):**
- The document must be in `documents.csv` with an `archive_path` pointing to a PDF, PNG or JPEG.
- It sends the file to Claude (`EXTRACT_MODEL`, default `claude-opus-5-5`) with a prompt listing the fixed `CATEGORY_KEYS`, and asks for leaf lines as JSON.
- The output is validated with zod (`buildDraftRows`). Invalid rows are reported with row and column, not written.
- Valid rows are appended as `status=draft`, and `extract-summary.md` is written.
- It refuses to run without a key and never publishes. It has **not been run live yet**, because no key was available during development. Only the pure functions are unit-tested.

**Repository settings that make this work (already configured):** Pages source is GitHub Actions; workflow permission "allow GitHub Actions to create and approve pull requests" is on. Optional variables: `BASE_PATH`, `SITE_URL`. Optional secret: `ANTHROPIC_API_KEY`.

---

## 8. Domain knowledge you need

- **Fiscal year:** July to June, written `2026-27`. The current FY is 2026-27.
- **UP budget law (Local Government (Union Parishad) Act 2009):**

  | Section | Rule |
  |---|---|
  | s.57 | The budget is prepared at least 60 days before 1 July, following ward shava priorities, and presented at a **public budget session**. A copy goes to the **UNO**, who may correct it within 30 days. |
  | s.58 | Final accounts go to the public session and are sent to the UNO within 60 days. |
  | s.4–7 | Ward shava: all voters of the ward; at least 2 meetings a year with 7 days' notice; quorum 5%. It sets project priorities and makes the beneficiary priority list, which the UP cannot change without a proven irregularity (s.6(7)). Spending without ward shava approval is the spender's personal liability (s.7(4)). |
  | s.49 | Citizen charter |
  | s.78–80 | Right to information; Tk 50/day penalty for delay |

  The Amendment Act 2026 (Act 44) changed elections only.
- **RTI Act 2009:**
  - s.8: apply on Form ক or plain paper.
  - s.9: answer within 20 working days (30 if several units are involved, 24 hours for life/death matters); a refusal must come within 10 working days.
  - s.24: appeal within 30 days; decided in 15.
  - s.25: complain to the Information Commission.
- **Complaint channels:**
  - ACC hotline 106 (toll-free)
  - GRS (grs.gov.bd, free; not for RTI)
  - 333 (60 paisa/min)
  - UNO, Tangail Sadar
- **Money sources and their jargon:**

  | Term | Meaning |
  |---|---|
  | ADP (এডিপি) | Development allocation |
  | LGSP/BBG (থোক বরাদ্দ / ইউনিয়ন উন্নয়ন সহায়তা) | Block grant; LGSP-3 ended in 2022 and the grant is now government-funded |
  | TR / KABIKHA / KABITA | Cash or food for work (KABIKHA amounts are often in metric tons of rice) |
  | EGPP | 40-day employment programme |
  | VGD (now VWB) / VGF | Rice for the poor |
  | 1% land-transfer tax | The UP's share of the tax on land sales |
  | Hat-bazar lease | Revenue from leasing local markets |
  | Holding tax | Tax on homesteads |

- **Plain-language labels used on the site (keep them):**
  - বাজেট, not আয়-ব্যয়
  - উন্নয়ন কাজ, not প্রকল্প, in headings
  - টেন্ডার (দরপত্র)
  - মূল কাগজপত্র, not নথিপত্র
  - কাজের বিনিময়ে খাদ্য/টাকা (টিআর, কাবিখা, কাবিটা)
  - ইউনিয়ন উন্নয়ন সহায়তা (থোক বরাদ্দ)
  - জমি কেনাবেচার করের ভাগ (১%)
  - গরিবদের চাল ও সহায়তা (ভিজিডি, ভিজিএফ)
  - ৪০ দিনের কর্মসূচি (ইজিপিপি)
  - তথ্য নেই / তথ্য চান
  - Rule of thumb: plain words first, acronym in brackets.

---

## 9. UI/UX conventions

- **Bangla first.** Numbers use Bangla digits with lakh/crore grouping (`৳৯৪.৬ লাখ`, `৳১,২০০`). Never write million or M. Every total also shows **পরিবারপ্রতি বাজেট** (budget per household, using Census 2022 households).
- **Mobile first.** Base font is 18px and tap targets are at least 44px. There must be no horizontal scroll at 320px (`body { overflow-wrap: break-word }`; links use `anywhere`).
- **Breakpoints:**
  - **900px and up:** container max 1080px, header top nav replaces the bottom nav, and the section menu has 4 columns.
  - **640px and up:** the menu has 2 columns.
  - **Up to 480px:** key/value lists and RTI letter fields stack into one column.
- **Home page order:**
  1. Title and intro sentence
  2. **"কী জানতে চান?" menu.** In the first row, ভাতা (teal), সেবার ফি (amber) and অধিকার (clay) are filled; the user asked for these to stand out.
  3. Budget card: headline, the "12 years old" warning, and the top 4 income and spending items
  4. Later partial years
  5. Disclosure scorecard
  6. "অন্যদের জানান" share box
- **Budget page:**
  - The source is shown once at the top; a row gets a badge only if its source differs from the page's main source.
  - Partial years are marked "(আংশিক)".
  - Category bars share one `max`, so they're proportional.
  - The neighbour comparison toggles between পরিবারপ্রতি and মোট বাজেট, and shows both numbers on every row.
- **Design tokens:**
  - `--primary` #0f6b66 (teal), `--accent` sand/amber, `--expense` clay, warm off-white background.
  - Full dark-mode palette.
  - Never use the government green-and-red look.
- **Logo** (`app/components/Logo.tsx`, `public/icon.svg`): an open ledger (খাতা) with a person on the left page and rising bars on the right, meaning জনতা + হিসাব.
- **Performance:** first load is at most 200 KB (CI-enforced). No chart libraries; import lucide icons by name only.
- **Print:** `@media print` hides the chrome. `/poster/...` is A4 with a QR code; the RTI page prints only the letter.

---

## 10. Gotchas that already cost time

1. **`ssr:false` prerendering fails** if a param route has a `loader` but zero prerendered paths. That's why `routes.ts` registers `projects/:id` and `tenders/:id` only when records exist. Typegen then skips those routes, so `project.tsx` and `tender.tsx` use `LoaderFunctionArgs` / `MetaFunction<typeof loader>` instead of `./+types/...`.
2. **With `basename`, React Router writes pages under `build/client/jonotar-hisab/…`.** `postbuild.ts` moves them up one level; otherwise every page ends up at `/jonotar-hisab/jonotar-hisab/`.
3. **`vite preview` serves the home page HTML for slash-less URLs** like `/projects`. That causes React error #418 locally only. Test with trailing slashes (`/projects/`). GitHub Pages redirects to the slash form.
4. **gov.bd portals send an incomplete TLS chain.** Node `fetch` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. The `scrape` npm script sets `NODE_EXTRA_CA_CERTS=scripts/certs/sectigo-dv-r36.pem` (expires 2036); use the same for ad-hoc curl or node calls.
5. **Bangla `য়`** may be precomposed or `য`+nukta. When grepping Bangla, search without the nukta (e.g. `আয`) or you will miss matches.
6. **Amounts in Bangla documents** look like `৪৪,৯২,৩৮৭/-` or `=১,৫৯,২০০/-`. `parseAmount` handles these; "লাখ" text is deliberately rejected.
7. **Testing Library auto-cleanup** needs vitest globals, which are off, so `tests/setup.ts` calls `cleanup`. Don't remove it.
8. **The dev server can go stale** after `git pull` or route changes and serve empty bodies. Restart it.
9. **Service worker registration can't be tested** in the Claude desktop browser pane, which refuses it. Check offline mode on a real phone.
10. **Old-style gov.bd URLs** (`/bn/site/...`) in search results are mostly 404 now. The old upazila DIMS page `tangailsadar.tangail.gov.bd/site/page/4c3fc5fd-…/বিভিন্ন-প্রকল্প` still works and had FY2012-13 Katuli projects. web.archive.org is not reachable from the dev machine.
11. **Most UP/upazila PDFs are scans or use the legacy SutonnyMJ font** (Katuli appears as `KvZzjx`), so text search misses them. LGED PDFs have an English text layer.
12. **`.vite/` (the dev dependency cache)** was committed once by accident. It's now gitignored and must not be committed.

---

## 11. How to make common changes

| Task | Steps |
|---|---|
| **Add a new budget** | 1. Save the file under `public/archive/<year>/`. 2. Add a `documents.csv` row. 3. Either type leaf lines into `budget_lines.csv` (`source_type=union`) plus the stated total into `budget_reported_totals.csv`, or run `npm run extract-budget -- <doc-id> <fy>` and review the draft rows. 4. Set `status=published`. 5. Update `disclosures.csv` (`budget-current` → `yes`, with `document_id`). The headline switches automatically (`headlineYear`). |
| **Add a neighbour union** | Add it to `union.json` `comparisons` (with households), add its lines and reported total, and add the document. |
| **Add a page or section** | Add a route in `routes.ts`, add its paths in `data/paths.ts`, add a tile in `SectionTiles.SECTIONS` and links in `BottomNav.NAV_ITEMS`/`Footer`. Every string goes through `t(bn, en)`. |
| **Add a scraper source** | Add an entry to `scripts/sources.json` (`id`, `issuer`, `url`, `linkPattern` regex, optional `tender: true` or `lged: {union, upazila}`). Do a local dry run with `npm run scrape`, then reset the files it wrote (`git checkout data/… && git clean -fd public/archive/<year>`). |
| **Change wording** | Keep the plain-language rules in §8–9, and update tests that assert exact Bangla strings (`tests/components.test.tsx`, `tests/budget-page.test.tsx`). |
| **Review a scraper PR** | Open each link. Mark useful rows `published` with proper titles and figures; mark unrelated or personal ones `ignored`, clear their `archive_path` and delete the file. Then merge. |

**Verify in a browser before saying UI work is done.** Check 375px and 320px widths (no horizontal scroll), Bangla and English, dark and light, and print preview for posters and the RTI letter.

---

## 12. Decisions log (why things are the way they are)

- **React SPA, with every route prerendered.** The owner chose React over the recommended Astro. Prerendering keeps the first load small and gives each page its own WhatsApp preview.
- **Data in CSV files plus git.** The owner maintains it; git history is the audit trail and there are no server costs.
- **Scraper opens PRs; it never publishes directly.** The exception is LGED tenders, which are verified row by row; the owner asked for "no manual work" there.
- **AI extraction is opt-in and draft-only.** A misread figure on a government budget is legal risk; the owner asked for the feature, and the gate stays.
- **Headline uses the latest budget the union itself published (2014-15), with an age warning.** Using the newest partial year (one ৳3.9 lakh grant) looked like the union's whole income.
- **Comparisons use each union's latest own budget,** not partial upstream years.
- **Surplus row (উদ্বৃত্ত) excluded from Katuli 2014-15 spending.** It isn't spending.
- **Five-year plan 2011-16 is stored as a reference document only.** It's a plan, not a budget.
- **Site name and labels:** জনতার হিসাব, chosen by the owner. Labels say "X ইউনিয়ন" and "বাজেট", per the owner.
- **Large PDFs (>8 MB: BBS census, LGD orders, Baghil budget) are linked by URL, not archived.** This keeps the repo small, at the risk of losing evidence if the portals delete them.

---

## 13. Open items and ideas

**Data the site doesn't have yet:**
- **Current Katuli budget.** File an RTI for it (the site's RTI page generates the letter).
- **Village↔ward mapping, ward members and 2026 leadership.** All unverified.
- **Citizen charter fees** (trade licence, citizenship and heir certificates). Unknown.
- **Per-ward allowance counts, and any counts after 2021.** Unknown.
- **Volunteer site visits.** None yet; the project timelines are empty.
- **`maintainer.whatsapp`.** Set it to enable the "tell us what you saw" button.

**Known gaps in the code:**
- **Scraper:**
  - It can save an HTML error page as if it were a PDF (it doesn't check content type or magic bytes).
  - It stays silent when a source suddenly matches 0 links.
  - Scraped titles go into the PR body without escaping.
- **Stale-budget warning:** its age is computed at build time. A monthly scheduled deploy would keep it current.
- **Actions pinning:** third-party actions are pinned by tag, not commit SHA.
- **og:image:** none yet; share previews show text only.
- **Upazila "হাট-বাজার" notice:** a scanned PDF still waiting for manual reading (marked `ignored`).

**Possible next steps:**
- AI reading for scanned non-budget PDFs (tender notices, hat-bazar lease lists).
- Volunteer photo-upload flow.
- Monthly cron deploy.
- Support for more unions.

---

## 14. History (short)

| Date | Change |
|---|---|
| 2026-09-26 | Research (3 agents), spec, 17-task plan. Built the scaffold, data layer, all pages, posters, service worker, scraper and CI. Seeded data. |
| 2026-09-27 | Went live on GitHub Pages. Renamed to জনতার হিসাব. Added LGED auto-publishing (6 Katuli tenders). Reviewed scraper PR #1. Plain-Bangla UX overhaul. Added logo, share options, responsive desktop layout and footer credits. Added AI budget extraction (opt-in, draft-only). Found more FY2012-13 projects on the old upazila page. Exhaustive search for a newer Katuli budget found none. Added "বাজেট" wording, total-budget comparison and featured tiles. |
