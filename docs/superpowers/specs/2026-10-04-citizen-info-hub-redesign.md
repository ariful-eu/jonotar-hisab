# Citizen information hub redesign — Design Spec

Date: 2026-10-04 · Status: approved in chat (2026-10-04) · Supersedes the positioning (not the rules) of `2026-09-26-katuli-budget-transparency-design.md`

## 1. Purpose

Reposition জনতার খাতা from a "budget watchdog" into **a helpful citizen-information service**: "কাতুলী ইউনিয়নের দরকারি সব তথ্য, এক জায়গায়" ("all the useful information about Katuli Union, in one place"). Budget transparency stays as one feature among several, worded neutrally. The product should be ready to grow into a multi-union service with user accounts later.

**Success criteria**
- A first-time visitor can find "how do I get a birth certificate / what does it cost" within 2 taps from home.
- Someone can learn which allowances they may qualify for in under a minute.
- Emergency and helpline numbers can be dialled with one tap.
- No page reads as an accusation. The site's language is about helping people get things done.
- All rules in `AGENTS.md` §2 still hold:
  - independent and unofficial
  - neutral wording
  - no beneficiary names
  - every figure sourced
  - "তথ্য নেই", never 0
  - honest headlines

## 2. Information architecture

| Route | Name (bn) | Content |
|---|---|---|
| `/` | হোম | See §3 |
| `/services` | সেবা পাবেন কীভাবে | Hub listing every service guide (card: icon, name, fee, time, "online too" badge) |
| `/services/:id` | — | One guide: what it is → who can apply → papers needed → fee (from `service_fees.csv` or the guide) → time → where to go (UP office / digital centre / online link) → steps → tips → "if there's a problem" → sources |
| `/allowances` | ভাতা ও সহায়তা | Existing explainer with a prominent "আমি কি পাব? যাচাই করুন" ("Do I qualify? Check") button |
| `/allowances/check` | ভাতা যাচাই | Client-side form: age, gender, approximate yearly income (≤ ৳45,000 or not), widowed/deserted, disability card (সুবর্ণ নাগরিক কার্ড), pregnant/mother of a young child. Results list possible allowances with monthly amounts and "how to apply". Nothing is stored or sent. |
| `/contacts` | দরকারি নম্বর | Grouped tap-to-call list (emergency, health, women and children, legal aid, agriculture, government information, local offices). Each entry shows its hours, whether it's free, and its source. |
| `/notices` | নোটিশ ও খবর | Published documents (union, upazila, district) and tenders, newest first, with an issuer filter |
| `/wards`, `/ward/:no` | আপনার এলাকা | As now, plus "এটা আমার ওয়ার্ড" ("this is my ward"), saved on the device. Home then shows a shortcut to that ward. |
| `/projects`, `/tenders` | উন্নয়ন কাজ, টেন্ডার | Same features, neutral wording; the ACC hotline is removed from project pages |
| `/budget` | ইউনিয়নের বাজেট | Same features. The intro calls it "সহজ ভাষায় বাজেট" ("the budget in plain language"); the age warning becomes a neutral info note. |
| `/rights` | নাগরিক গাইড | Same 4 topics, retitled as practical help |
| `/documents` | মূল কাগজপত্র | The scorecard is retitled "তথ্য সংগ্রহের অবস্থা" ("information we've gathered") and invites people to share documents |
| `/about` | আমাদের সম্পর্কে | Mission as an information service, how data is collected, a "get updates" box (links shown only when configured), and a roadmap link |

**Navigation**
- **Bottom nav (phones):** হোম · সেবা · ভাতা · নম্বর · আরও. "আরও" ("more") goes to a section list on home.
- **Desktop top nav:** হোম, সেবা, ভাতা, দরকারি নম্বর, বাজেট, নাগরিক গাইড.

## 3. Home page

Top to bottom:
1. Headline "কাতুলী ইউনিয়নের দরকারি সব তথ্য, এক জায়গায়" and a one-line intro.
2. **Search box** ("কী খুঁজছেন? যেমন: জন্ম নিবন্ধন", i.e. "What are you looking for? e.g. birth registration"). It searches a build-time index on the device.
3. **Quick actions** (6 large tiles):
   - সেবা পাবেন কীভাবে (services, filled)
   - ভাতা যাচাই (allowance check, filled)
   - দরকারি নম্বর (useful numbers, filled)
   - আপনার এলাকা (your area)
   - নোটিশ (notices)
   - ইউনিয়নের বাজেট (budget)
4. **"আমার ওয়ার্ড"** shortcut card, if a ward is saved.
5. **এক নজরে কাতুলী ইউনিয়ন** ("Katuli Union at a glance"): population, households, wards, villages, area, and the latest published budget with its year. Each figure is sourced.
6. **সর্বশেষ নোটিশ ও টেন্ডার** (latest notices and tenders): 5 items plus "সব দেখুন" (see all).
7. **More sections list:**
   - উন্নয়ন কাজ (development works)
   - টেন্ডার (tenders)
   - নাগরিক গাইড (citizen guide)
   - মূল কাগজপত্র (original documents)
   - বাজেট বিস্তারিত (budget details)
8. Emergency strip: "জরুরি প্রয়োজনে ৯৯৯" ("in an emergency, 999"), with tap to call.
9. Share box.

The large budget hero card and the "0 of 10 published" scorecard move off the home page. The budget appears as a fact in "এক নজরে" and in full on `/budget`.

## 4. Tone rules (additions to AGENTS.md §2 and §8)

- Write service-shaped sentences: "কীভাবে পাবেন / কী লাগবে / কোথায় যাবেন / কত টাকা / কত দিন" (how to get it / what's needed / where to go / how much / how long).
- Avoid watchdog words in headings: "অভিযোগ" ("complaint") only appears under "সমস্যা হলে" ("if there's a problem"). Don't use "স্বচ্ছতা দাবি" ("demand transparency") or similar.
- A missing document is an invitation, not a charge: "এই তথ্য এখনো আমাদের কাছে নেই — আপনার কাছে থাকলে দিন, বা কীভাবে চাইবেন দেখুন" ("We don't have this yet. If you do, share it, or see how to ask for it").
- Unverified facts in guides, such as a fee or a phone number, show "যাচাই চলছে" ("being verified") or are omitted. They are never guessed.

## 5. Data and content

**`data/contacts.csv`**
- Columns: `id, category, name_bn, name_en, number, hours_bn, free (yes/no/unknown), note_bn, source_doc, status`
- `category`: one of `emergency`, `health`, `women_children`, `legal`, `agriculture`, `govt_info`, `utility`, `local_office`.
- Validated with zod.
- `number` must contain digits and may include spaces, `+` or `-`. The UI builds the `tel:` link from the digits and `+` only.

**`app/content/service-guides.ts`**
- Typed `ServiceGuide[]`, with each guide containing:
  - `id`, `icon`, `title_bn/en`, `summary_bn/en`
  - `who_bn/en`
  - `papers: {bn,en}[]`
  - `fee_ids` (keys into `service_fees.csv`) and/or `fee_note_bn/en`
  - `time_bn/en`
  - `where: {kind: "up"|"udc"|"online"|"other", label_bn, label_en, url?}[]`
  - `steps`, `tips`
  - `source_docs: string[]`
- Content comes from the verified research (§7). Anything unverified is omitted or marked.

**Eligibility rules (`app/lib/eligibility.ts`)**
- Pure function: `checkEligibility(a: Answers, allowances: AllowanceRow[]): EligibilityResult[]`.
- Answers: age, gender (`male | female | other`), `lowIncome: boolean | null`, `widowed: boolean`, `disabilityCard: boolean`, `motherOrPregnant: boolean`.

| Allowance | Result is "likely" when |
|---|---|
| Old age | Age ≥ 65 (men) or ≥ 62 (women and other), and income is not "no" |
| Widow / deserted | Woman, age ≥ 18, widowed, and income is not "no" |
| Disability | Has a disability card |
| Mother & child | Mother or pregnant, and income is not "no" |

- Each result is one of `likely`, `maybe` (income unknown) or `no`. The page shows only `likely` and `maybe`.
- Results always include "চূড়ান্ত সিদ্ধান্ত ওয়ার্ড সভা ও ইউনিয়ন কমিটির" ("the final decision rests with the ward shava and the union committee") and how to apply.
- Monthly amounts are read from `allowances.csv`.

**Search (`app/lib/search.ts`)**
- At build time, a loader-free module generates `public/search-index.json`, about 10–20 KB.
- Each entry: `{title_bn, title_en, keywords, url, kind}`.
- It covers sections, service guides, rights topics, contacts, wards, projects and tenders.
- `searchIndex(entries, query)` is pure: it normalises Bangla and English (lowercase, strips the nukta variant), scores token prefix matches, and returns the top 8.
- The component fetches the index only on first focus, so first-load size is unaffected.

**Preferences (`app/lib/prefs.ts`)**
- `getMyWard()` / `setMyWard()` use `localStorage` (try/catch), following the language-preference pattern.
- This is the single place to swap for account storage later.

**Notices feed**
- Built by the loader from `documents` with `status=published` and issuer in `union | upazila | district`, plus `tenders`. Sorted by date descending.
- Documents without a date go last.
- Research-only documents (laws, comparisons) are excluded by issuer `ministry` / `other`, with explicit exceptions: neighbouring unions' budgets are excluded via an id prefix list.

## 6. Roadmap document

`docs/product-roadmap.md` covers:
- vision
- current state (v1, static)
- v2: accounts (phone OTP), saved ward, WhatsApp/SMS notifications for new notices in your ward, volunteer reporting with photos and moderation
- v3: multi-union (`/u/<union-slug>`, with data folders per union)
- sustainability options: grants, CSR, a paid version for NGOs/UPs, a white-label offer
- metrics
- risks: legal, privacy, data freshness

It stays honest and modest.

## 7. Content sources

Service steps, fees and helpline numbers come only from official or authoritative sources gathered by research on 2026-10-04 (bdris/orgbdr, NID wing, land.gov.bd, dss.gov.bd, national helpline pages). Each one has a `documents.csv` row.

## 8. Testing

- **Unit tests:**
  - `checkEligibility`: thresholds, unknown income, gender, widow, disability, empty results
  - `searchIndex`: Bangla query, English query, prefix match, no match
  - the `contacts` schema and tel-link builder
  - notices-feed ordering
- **Data test** covers the new CSV.
- **Build test:** all new routes prerender; size check stays ≤ 200 KB.
- **Browser check:** home, services, one guide, checker (two scenarios), contacts, notices, a ward with "my ward" saved. Check 375 px and 320 px, Bangla and English, light and dark.

## 9. Out of scope (later, see roadmap)

Accounts, server-side storage, notifications, multi-union routing, and online forms that submit anywhere.
