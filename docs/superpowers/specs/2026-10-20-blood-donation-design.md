# Blood donation (রক্তদান) — Design Spec

Date: 2026-10-20 · Status: approved in chat (2026-10-20); Phase A built, Phase B built and waiting for the owner's form links · Builds on `2026-10-04-citizen-info-hub-redesign.md`

## 1. Purpose

Help people in Katuli Union find blood quickly and let willing people register as donors, without exposing donors to spam, harassment or scams.

**Owner's decisions (2026-10-20):**
- Storage is **Google Form + Google Sheet**. The site stays static with no server of our own.
- **Minimal donor data:** name, phone, area / simple address, blood group. No ward, last-donation date or other details.
- **No phone numbers from the database are ever shown on the site**, whether donors' or requesters'.
- **The site shows only which blood groups are available** from donors in the Katuli Union area.
- **Requests go to the owner/volunteers, who call matching donors** from the private sheet. There is no public request board.

**Success criteria**
- Someone needing blood finds the nearest blood bank, the compatible groups, and how to post a request, within 2 taps from home.
- Someone willing to donate can register in under a minute.
- No name, phone number or address from the sheet is ever visible on the site or in any public file.
- A blood request reaches the owner/volunteers, who connect the requester with a matching donor.

## 2. Two phases

### Phase A: blood information page (static, ships first)

Route `/blood`, named "রক্তদান" ("blood donation"). Sections:

1. **রক্ত লাগলে** ("if you need blood")
   - Tangail General Hospital blood bank, and voluntary groups active in Tangail (Sandhani, Badhan, Red Crescent and others), with tap-to-call.
   - Only numbers verified on official or organisation pages, each with a `contacts.csv` row (new category `blood`) and a `source_doc`.
2. **কে রক্ত দিতে পারবেন** ("who can donate")
   - Age, weight, gap between donations, and when not to donate.
   - Taken only from an official source (DGHS Safe Blood Transfusion Programme or WHO). Anything unverified is left out.
3. **কোন গ্রুপ কাকে দিতে পারে** ("which group can give to whom")
   - An 8×8 compatibility chart for red cells, with a "your group" picker that highlights the matches.
4. **সাবধান** ("be careful")
   - "রক্তের জন্য কাউকে টাকা দেবেন না" ("never pay anyone for blood"). The hospital charges only the official screening fee.
   - A donor or "agent" asking for money is a warning sign.
5. **রক্তদাতা হোন / রক্তের অনুরোধ** ("become a donor / request blood")
   - Phase B entry points, shown only when the form URLs are configured.

**Home changes**
- New quick-action tile **"রক্ত দিন / রক্ত খুঁজুন"** ("give blood / find blood"), red tone `tone-blood` (dark-mode safe).
- **ইউনিয়নের বাজেট** moves from the quick actions to "আরও দেখুন". It stays in the desktop top nav, so quick actions stay at 6.
- Search index entries for রক্ত, blood, রক্তদাতা, and each group (A+, O− …).

### Phase B: donors and requests via Google Forms

The owner creates the forms and sheet in their own Google account; Claude cannot sign in or create accounts. Claude supplies the exact field list, sheet formulas and step-by-step setup in `docs/blood-setup.md`.

**Form 1: become a donor (রক্তদাতা নিবন্ধন)**

| Field | Required | Notes |
|---|---|---|
| Name | yes | Private |
| Phone | yes | Private. Used only by the owner/volunteers to ask the donor when blood is needed. |
| Area / address | yes | Free text, e.g. village or para name. Private. |
| Blood group | yes | Dropdown with the 8 groups |
| Consent | yes | "আমি রাজি যে জনতার খাতা আমার তথ্য গোপন রাখবে এবং শুধু রক্তের প্রয়োজনে যোগাযোগ করবে" ("I agree that Jonotar Khata will keep my details private and contact me only when blood is needed") |

**Form 2: request blood (রক্তের অনুরোধ)**

| Field | Required | Notes |
|---|---|---|
| Blood group needed | yes | |
| Bags | yes | |
| Hospital | yes | |
| Needed by (date/time) | yes | |
| Contact phone | yes | Private; only the owner/volunteers see it |
| Consent | yes | "আমার নম্বর শুধু রক্তদাতা খুঁজে দেওয়ার জন্য ব্যবহার হবে" ("my number will be used only to find a donor") |

**Sheet layout (owner's Google Sheet)**
- **Private tabs:**
  - `donors`: Form 1 responses, plus an owner column `active` (yes/no). Setting it to "no" pauses a donor, for example after they have just given blood or if they asked to be removed.
  - `requests`: Form 2 responses, plus an owner column `status` (new / contacting / done).
- **Public tab `public_groups`:**
  - One row per blood group with `available` set to yes or no.
  - It is computed with `COUNTIFS(donors group, X, active, "<>no") > 0`.
  - **No names, phones, areas or counts**, only whether that group is available.
- **Publishing:** only `public_groups` is published (File → Share → Publish to web → that tab, as CSV). The spreadsheet itself stays private.

**On the site**
- **Config:** `data/union.json` gains a `blood` block:
  - `donor_form_url`
  - `request_form_url`
  - `groups_csv_url`
  - `remove_form_url` (optional)
  - All are null until configured. When null, the Phase B UI is hidden and Phase A still works.
- **"কাতুলী ইউনিয়নে এখন যে গ্রুপের রক্তদাতা আছেন"** ("blood groups with donors available in Katuli Union now"):
  - A grid of the 8 groups, each marked "আছে" ("available") or "এখনো নেই" ("none yet").
  - It is fetched **in the browser at view time** from the published CSV, so it updates without a rebuild. Google caches it for about 5 minutes.
  - Offline or on fetch failure: show "এখন তথ্য আনা যাচ্ছে না" ("can't load right now") together with the static Phase A content.
- **Buttons:**
  - "রক্তের অনুরোধ করুন" ("request blood") opens Form 2. The note above it reads: "আমরা মিলে যাওয়া রক্তদাতার সাথে যোগাযোগ করে আপনাকে জানাব; জরুরি হলে সাথে সাথে নিচের ব্লাড ব্যাংকে কল করুন" ("we'll contact a matching donor and let you know; if it's urgent, call the blood banks below right away").
  - "রক্তদাতা হোন" ("become a donor") opens Form 1.
  - Each button has a short privacy note above it.
- **Exception to the build-time-data rule:** this runtime fetch is the only one, documented in AGENTS.md. The CSV is tiny and parsed with a few lines of code, with no library.

**Removal:**
- An optional Form 3 ("আমার নাম সরিয়ে দিন" — "remove me") takes a phone number.
- The owner deletes the matching row; the target is within 7 days, stated on the page.

## 3. Coordination (owner/volunteer)

1. Turn on Google Sheets "notify me on form submission" so every new request emails the owner.
2. For a request, filter `donors` by blood group, call donors in or near the requester's area, and connect them with the requester.
3. Set `status` to `done`. Delete request rows after 30 days (stated in the privacy note).
4. After a donor gives blood, set `active` to `no` and switch it back after the official waiting period.
5. More volunteers can help by sharing the private sheet with them (edit access only to trusted people).

## 4. Rules (additions to AGENTS.md §2)

- **Minimum data.** Donors give name, phone, area and group. Requests give group, bags, hospital, time and phone. No patient names, NIDs, diseases or photos.
- **Nothing personal is ever published.** The site shows only which groups are available. The sheet is never exported, shared outside trusted volunteers, or handed to any organisation.
- **We connect people; we are not a blood bank.** No medical claims. Eligibility facts come only from official sources.
- **Anti-money warning** on the page.
- **Plain-Bangla privacy note on both forms:**
  - what is collected
  - who sees it
  - how long it's kept
  - how to be removed

## 5. Risks

| Risk | Mitigation |
|---|---|
| Scam or fake requests | Requests are never published; the owner calls the requester before involving any donor; anti-money warning |
| Harassment of donors | No personal data is published; only trusted volunteers see the sheet |
| Owner unavailable when blood is urgent | The page says to call the blood banks right away for urgent needs; more volunteers on the sheet |
| "Available" shown for a donor who just gave blood | Owner sets `active=no` after each donation |
| Google changes publish-to-web | Fetch failure falls back to Phase A content |
| Wrong medical facts | Official source only, cited on the page |

## 6. Testing

- **Unit tests:**
  - the compatibility function (`canDonateTo` / `canReceiveFrom` for all 64 pairs)
  - the `public_groups` CSV parser, including missing groups, an empty sheet and unexpected columns, which are ignored so a personal column can never be shown even by mistake
  - the `blood` config schema
- **Data test:** the new `contacts.csv` category and its sources.
- **Size:** the first load stays ≤ 200 KB; the blood page's CSV parsing is lazy.
- **Browser check:**
  - `/blood` with no config (Phase A only)
  - `/blood` with a fixture CSV (available and not-available groups, fetch failure)
  - 320/375 px, Bangla/English, dark/light

## 7. Out of scope

- Public request board
- Automatic donor matching and SMS/WhatsApp alerts (v2)
- Our own backend and OTP accounts
- Multi-union
