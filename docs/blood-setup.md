# Blood donation: one-time Google setup (for the owner)

The `/blood` page already works without this. It shows the hospital, safety advice, who can donate, and which group can give to whom.

These steps add three things:
- the **"রক্তদাতা হোন"** (become a donor) form
- the **"রক্তের অনুরোধ করুন"** (request blood) form
- the **available blood groups** grid

Everything lives in **your own Google account**. The site only ever reads one tab, which contains `group,available` and nothing else.

Time needed: about 30 minutes.

---

## 1. Donor form: "রক্তদাতা নিবন্ধন — জনতার খাতা"

Create it at forms.google.com → Blank form. Add these questions, in this order:

| # | Question | Type | Required |
|---|---|---|---|
| 1 | নাম (Name) | Short answer | Yes |
| 2 | ফোন নম্বর (Phone) | Short answer | Yes |
| 3 | এলাকা / ঠিকানা (গ্রাম, পাড়া) (Area / address) | Short answer | Yes |
| 4 | রক্তের গ্রুপ (Blood group) | Dropdown: `A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-` | Yes |
| 5 | সম্মতি (Consent) | Checkbox: "আমি রাজি যে জনতার খাতা আমার তথ্য গোপন রাখবে এবং শুধু রক্তের প্রয়োজনে আমার সাথে যোগাযোগ করবে। যেকোনো সময় নাম সরিয়ে নিতে পারব।" | Yes |

Notes:
- Type the dropdown options exactly as shown, with a normal keyboard minus sign.
- Put this privacy note in the form description: "আপনার নাম, নম্বর ও ঠিকানা কোথাও প্রকাশ করা হবে না। শুধু জনতার খাতার স্বেচ্ছাসেবকেরা দেখবেন, আর রক্তের দরকার হলে আপনাকে ফোন করে জিজ্ঞেস করবেন। নাম সরাতে চাইলে জানালে ৭ দিনের মধ্যে সরিয়ে দেওয়া হবে।"
- In **Settings**, turn **off** "Collect email addresses". Nobody should have to sign in.

## 2. Request form: "রক্তের অনুরোধ — জনতার খাতা"

| # | Question | Type | Required |
|---|---|---|---|
| 1 | কোন গ্রুপের রক্ত লাগবে (Blood group needed) | Dropdown (same 8 options) | Yes |
| 2 | কত ব্যাগ (Bags) | Short answer, number | Yes |
| 3 | কোন হাসপাতালে (Hospital) | Short answer | Yes |
| 4 | কবে, কখন লাগবে (When) | Date + time | Yes |
| 5 | যোগাযোগের ফোন নম্বর (Contact phone) | Short answer | Yes |
| 6 | সম্মতি (Consent) | Checkbox: "আমার নম্বর শুধু রক্তদাতা খুঁজে দেওয়ার জন্য ব্যবহার হবে।" | Yes |

Notes:
- Don't ask for the patient's name or illness. They aren't needed.
- Put this in the description: "খুব জরুরি হলে সাথে সাথে টাঙ্গাইল জেনারেল হাসপাতালে যোগাযোগ করুন। রক্তের জন্য কাউকে টাকা দেবেন না।"

## 3. Removal form (optional): "তালিকা থেকে নাম সরান"

Use it so donors can ask to leave the list. It has one question, ফোন নম্বর (Phone), as a required short answer.

## 4. One spreadsheet for everything

1. In each form, go to **Responses → Link to Sheets → Create a new spreadsheet** for the first form. For the second and third forms, choose **Select existing spreadsheet** and pick the same one. You get one spreadsheet with one tab per form.
2. Rename the tabs `donors`, `requests` and `removals`.
3. In `donors`, add a column header `active` to the right of the last column. Usually that's column **G**: A = timestamp, B = name, C = phone, D = area, E = group, F = consent.
   - Leave `active` empty for a normal donor.
   - Type `no` to pause a donor: after they give blood, or when they ask to be removed (better: delete their row).
4. In `requests`, add a column `status` to the right. Fill it with `new`, `contacting` or `done` as you work.
5. Add a new tab named **`public_groups`** and fill it exactly like this:

| | A | B |
|---|---|---|
| 1 | `group` | `available` |
| 2 | `A+` | `=IF(COUNTIFS(donors!$E:$E, A2, donors!$G:$G, "<>no") > 0, "yes", "no")` |
| 3 | `A-` | (copy B2 down) |
| 4 | `B+` | |
| 5 | `B-` | |
| 6 | `AB+` | |
| 7 | `AB-` | |
| 8 | `O+` | |
| 9 | `O-` | |

   - If your blood-group column isn't E or `active` isn't G, change the letters in the formula.
   - In Sheets, `A-` may be read as a formula. If it shows an error, type `'A-` with a leading apostrophe.
6. **Publish only that tab.** Go to File → Share → **Publish to web**.
   - Under "Link", choose the tab **`public_groups`** (not "Entire document") and the format **Comma-separated values (.csv)**.
   - Tick "Automatically republish when changes are made", then click Publish and copy the link.
   - Check it: the link should open a file showing only `group,available` and 8 rows.
7. Keep the spreadsheet itself private. Share it (Editor) only with volunteers you trust.

## 5. Get an email for every new request

In the spreadsheet: **Tools → Notification settings → Configure notifications → "A user submits a form" → "Email – right away"**.

## 6. Send me (or the next agent) four links

- Donor form link (Send → link icon)
- Request form link
- The published `public_groups` CSV link
- Removal form link (optional)

These go into `data/union.json` under `"blood"`. The donor and request buttons appear as soon as their links are set, and the groups grid appears once the CSV link is set.

```json
"blood": {
  "donor_form_url": "https://forms.gle/…",
  "request_form_url": "https://forms.gle/…",
  "groups_csv_url": "https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&single=true&output=csv",
  "remove_form_url": "https://forms.gle/…"
}
```

## 7. Day-to-day

| When | What to do |
|---|---|
| A request email arrives | Open `requests` and call the requester to confirm the request is real. Filter `donors` by blood group, call donors near that area, and put the donor and requester in touch. Mark `status` as `done`. Never ask for or pass on money. |
| A donor gives blood | Set their `active` to `no`. Switch it back after the waiting period their doctor gave them. |
| A removal arrives | Delete that donor's row within 7 days. |
| Monthly | Delete `requests` rows older than 30 days, and old `removals` rows. |

**Never** export, forward or share the donor list with anyone outside your trusted volunteers, including organisations, politicians or businesses.
