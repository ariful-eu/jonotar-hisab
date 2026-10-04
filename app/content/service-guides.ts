export type Bi = { bn: string; en: string };
export type GuideWhere = { kind: "up" | "udc" | "online" | "other"; label_bn: string; label_en: string; url?: string };
export type ServiceGuide = {
  id: string;
  icon: "baby" | "flower" | "pencil" | "id" | "users" | "store" | "landmark" | "hand";
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

const UP: GuideWhere = { kind: "up", label_bn: "কাতুলী ইউনিয়ন পরিষদ কার্যালয়", label_en: "Katuli Union Parishad office" };
const UDC: GuideWhere = { kind: "udc", label_bn: "ইউনিয়ন ডিজিটাল সেন্টার (ইউনিয়ন পরিষদ ভবনে)", label_en: "Union Digital Centre (in the UP building)" };
const BDRIS: GuideWhere = { kind: "online", label_bn: "অনলাইনে: bdris.gov.bd", label_en: "Online: bdris.gov.bd", url: "https://bdris.gov.bd/" };
const UNKNOWN_PAPERS: Bi = { bn: "আর কোন কাগজ লাগবে, ইউনিয়ন পরিষদ জানিয়ে দেবে — যাওয়ার আগে ফোনে বা ওয়ার্ড সদস্যের কাছে জেনে নিন।", en: "The Union Parishad will tell you what else is needed — ask by phone or through your ward member before you go." };

export const SERVICE_GUIDES: ServiceGuide[] = [
  {
    id: "birth-registration",
    icon: "baby",
    title_bn: "জন্ম নিবন্ধন",
    title_en: "Birth registration",
    summary_bn: "শিশু বা বড় — যেকোনো বয়সে জন্ম নিবন্ধন করা যায়। জন্মের ৪৫ দিনের মধ্যে করলে সম্পূর্ণ বিনামূল্যে।",
    summary_en: "Anyone of any age can register a birth. Free within 45 days of birth.",
    keywords: "জন্ম সনদ জন্ম নিবন্ধন birth certificate registration bdris শিশু",
    who: [
      { bn: "নবজাতক শিশু — বাবা, মা বা অভিভাবক আবেদন করবেন।", en: "A newborn — a parent or guardian applies." },
      { bn: "যার এখনো জন্ম নিবন্ধন হয়নি এমন যেকোনো বয়সের মানুষ।", en: "Anyone of any age who has never been registered." },
    ],
    papers: [
      { bn: "শিশুর ক্ষেত্রে: বাবা ও মায়ের জন্ম নিবন্ধন নম্বর (পরিবারের সবার নিবন্ধন একসাথে যুক্ত থাকে)।", en: "For a child: the father's and mother's birth registration numbers (family records are linked)." },
      { bn: "বড়দের ক্ষেত্রে: বয়সের প্রমাণ — শিক্ষা সনদ বা জাতীয় পরিচয়পত্র।", en: "For adults: proof of age — an education certificate or national ID." },
      { bn: "আবেদনকারী বা বাবা-মায়ের নিজের মোবাইল নম্বর।", en: "The applicant's or a parent's own mobile number." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: ["birth-reg-45d", "birth-reg-5y", "birth-reg-late"],
    where: [UP, UDC, BDRIS],
    steps: [
      { bn: "ইউনিয়ন ডিজিটাল সেন্টারে যান, অথবা নিজে bdris.gov.bd ওয়েবসাইটে \"জন্ম নিবন্ধন আবেদন\" পূরণ করুন।", en: "Go to the Union Digital Centre, or fill in \"birth registration application\" yourself at bdris.gov.bd." },
      { bn: "আবেদনপত্র প্রিন্ট করে কাগজপত্রসহ ইউনিয়ন পরিষদে জমা দিন।", en: "Print the application and submit it with the papers at the Union Parishad." },
      { bn: "নির্ধারিত ফি দিন এবং অবশ্যই রসিদ নিন।", en: "Pay the official fee and always take a receipt." },
      { bn: "bdris.gov.bd-তে \"আবেদনের বর্তমান অবস্থা\" থেকে অগ্রগতি দেখুন।", en: "Track progress under \"application status\" on bdris.gov.bd." },
      { bn: "সনদ বাংলা ও ইংরেজি দুই ভাষায় দেওয়া হয় — মূল সনদের জন্য কোনো টাকা লাগে না।", en: "The certificate is issued in both Bangla and English — the original is free." },
    ],
    tips: [
      { bn: "স্কুলে ভর্তি, চাকরি, পাসপোর্ট, জাতীয় পরিচয়পত্রসহ অনেক কাজে জন্ম সনদ লাগে — দেরি না করে করিয়ে নিন।", en: "A birth certificate is needed for school admission, jobs, passports, national ID and more — don't delay." },
      { bn: "বিবাহিত নারী স্বামীর স্থায়ী ঠিকানায় বা নিজের জন্মস্থানে নিবন্ধন করতে পারেন; সনদে বাবা-মায়ের নাম থাকে, স্বামীর নাম নয়।", en: "A married woman can register at her husband's permanent address or her birthplace; the certificate shows her parents' names, not her husband's." },
      { bn: "একটি মোবাইল নম্বর পরিবারের সর্বোচ্চ ৫ জনের নিবন্ধনে ব্যবহার করা যায়। অফিসের কারো ব্যক্তিগত নম্বর দেবেন না।", en: "One mobile number can be used for up to 5 family members. Never use an office worker's personal number." },
    ],
    source_docs: ["orgbdr-fees", "orgbdr-faq", "bdris-portal"],
  },
  {
    id: "death-registration",
    icon: "flower",
    title_bn: "মৃত্যু নিবন্ধন",
    title_en: "Death registration",
    summary_bn: "পরিবারের কেউ মারা গেলে মৃত্যু নিবন্ধন করুন — ওয়ারিশ সনদ ও জমি-সম্পত্তির কাজে এটি লাগে। ৪৫ দিনের মধ্যে বিনামূল্যে।",
    summary_en: "Register a family member's death — it's needed for heir certificates and property. Free within 45 days.",
    keywords: "মৃত্যু সনদ মৃত্যু নিবন্ধন death certificate registration ওয়ারিশ",
    who: [{ bn: "মৃত ব্যক্তির পরিবারের সদস্য বা অভিভাবক।", en: "A family member or guardian of the person who died." }],
    papers: [
      { bn: "মৃত ব্যক্তির জন্ম নিবন্ধন নম্বর — জন্ম নিবন্ধন ছাড়া মৃত্যু নিবন্ধন করা যায় না।", en: "The deceased's birth registration number — a death can't be registered without it." },
      { bn: "আবেদনকারীর নিজের মোবাইল নম্বর।", en: "The applicant's own mobile number." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: [],
    fee_note: { bn: "মৃত্যুর ৪৫ দিনের মধ্যে বিনামূল্যে; ৪৫ দিন থেকে ৫ বছর পর্যন্ত ৳২৫; ৫ বছর পরে ৳৫০।", en: "Free within 45 days of the death; Tk 25 from 45 days to 5 years; Tk 50 after 5 years." },
    where: [UP, UDC, BDRIS],
    steps: [
      { bn: "ডিজিটাল সেন্টারে বা bdris.gov.bd-তে \"নতুন মৃত্যু নিবন্ধন আবেদন\" পূরণ করুন।", en: "Fill in \"new death registration application\" at the digital centre or on bdris.gov.bd." },
      { bn: "প্রিন্ট করে ইউনিয়ন পরিষদে জমা দিন, ফি দিয়ে রসিদ নিন।", en: "Print it, submit it at the Union Parishad, pay and take a receipt." },
      { bn: "সনদ হাতে পেলে ওয়ারিশ সনদের আবেদন করতে পারবেন।", en: "Once you have the certificate you can apply for an heir certificate." },
    ],
    tips: [{ bn: "মৃত্যু নিবন্ধন না হলে উত্তরাধিকার (ওয়ারিশ) নিশ্চিত করা যায় না — তাই দ্রুত করিয়ে নিন।", en: "Inheritance can't be settled without death registration, so do it promptly." }],
    source_docs: ["orgbdr-fees", "orgbdr-faq", "bdris-portal"],
  },
  {
    id: "certificate-correction",
    icon: "pencil",
    title_bn: "জন্ম/মৃত্যু সনদ সংশোধন ও কপি",
    title_en: "Correcting or copying a birth/death certificate",
    summary_bn: "নাম, বাবা-মায়ের নাম, ঠিকানা বা জন্ম তারিখে ভুল থাকলে সংশোধন; হারিয়ে গেলে নকল কপি।",
    summary_en: "Fix a wrong name, parent's name, address or date of birth; get a copy if lost.",
    keywords: "সংশোধন ভুল নকল কপি পুনঃমুদ্রণ ১৭ ডিজিট correction duplicate copy",
    who: [{ bn: "যার সনদে ভুল আছে বা সনদ হারিয়েছে।", en: "Anyone whose certificate has a mistake or is lost." }],
    papers: [
      { bn: "পুরনো জন্ম/মৃত্যু সনদ বা নিবন্ধন নম্বর।", en: "The old certificate or registration number." },
      { bn: "সঠিক তথ্যের প্রমাণ (যেমন শিক্ষা সনদ বা জাতীয় পরিচয়পত্র) — কোনটি লাগবে নিবন্ধক জানাবেন।", en: "Proof of the correct details (e.g. an education certificate or national ID) — the registrar will say which." },
    ],
    fee_ids: ["birth-cert-correct-dob", "birth-cert-correct-other", "birth-cert-duplicate"],
    where: [UP, BDRIS],
    steps: [
      { bn: "bdris.gov.bd-তে \"তথ্য সংশোধন আবেদন\" বা \"সনদ পুনঃমুদ্রণ\" বেছে নিন, অথবা ডিজিটাল সেন্টারে সাহায্য নিন।", en: "Choose \"correction application\" or \"certificate reprint\" on bdris.gov.bd, or get help at the digital centre." },
      { bn: "যে ইউনিয়ন/অফিসে নিবন্ধন হয়েছিল, সেখানেই সংশোধন হয়।", en: "Corrections are made by the office where the registration was done." },
      { bn: "ফি দিয়ে রসিদ নিন; সংশোধিত সনদের কপি বিনামূল্যে।", en: "Pay and take a receipt; the corrected certificate is free." },
    ],
    tips: [{ bn: "পুরনো সনদের নম্বর ১৭ ডিজিটের কম হলে নিবন্ধন অফিসে পুরনো সনদ জমা দিয়ে ১৭ ডিজিটের নতুন সনদ নিন।", en: "If the old number has fewer than 17 digits, hand in the old certificate at the registration office for a new 17-digit one." }],
    source_docs: ["orgbdr-fees", "orgbdr-faq", "bdris-portal"],
  },
  {
    id: "citizenship-certificate",
    icon: "id",
    title_bn: "নাগরিকত্ব সনদ",
    title_en: "Citizenship certificate",
    summary_bn: "ইউনিয়নের স্থায়ী বাসিন্দা হিসেবে প্রমাণপত্র — চাকরি, ভর্তি বা বিভিন্ন আবেদনে লাগে।",
    summary_en: "Proof that you are a permanent resident of the union — needed for jobs, admissions and applications.",
    keywords: "নাগরিকত্ব সনদ নাগরিক সনদ citizenship certificate চারিত্রিক",
    who: [{ bn: "কাতুলী ইউনিয়নের বাসিন্দা।", en: "Residents of Katuli Union." }],
    papers: [
      { bn: "নিজের জন্ম নিবন্ধন বা জাতীয় পরিচয়পত্রের কপি সাথে রাখুন।", en: "Bring a copy of your birth registration or national ID." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: ["citizenship-cert"],
    where: [UP, UDC],
    steps: [
      { bn: "ইউনিয়ন পরিষদ বা ডিজিটাল সেন্টারে আবেদন করুন।", en: "Apply at the Union Parishad or digital centre." },
      { bn: "ফি দিলে অবশ্যই রসিদ নিন।", en: "If you pay a fee, always take a receipt." },
    ],
    tips: [{ bn: "ফি ইউনিয়ন পরিষদের কর তফসিল অনুযায়ী হয়। কাতুলী ইউনিয়নের ফি তালিকা এখনো আমাদের হাতে আসেনি — জানতে পারলে এখানে যোগ হবে।", en: "The fee follows the union's tax schedule. We don't have Katuli's fee list yet — it will be added when we do." }],
    source_docs: ["law-up-act-2009"],
  },
  {
    id: "heir-certificate",
    icon: "users",
    title_bn: "ওয়ারিশ সনদ",
    title_en: "Heir (warish) certificate",
    summary_bn: "কেউ মারা গেলে তার উত্তরাধিকারী কারা — তার প্রমাণপত্র। জমি, ব্যাংক বা পেনশনের কাজে লাগে।",
    summary_en: "Proof of who the heirs of a deceased person are — needed for land, bank accounts and pensions.",
    keywords: "ওয়ারিশ সনদ উত্তরাধিকার heir certificate warish inheritance জমি",
    who: [{ bn: "মৃত ব্যক্তির উত্তরাধিকারী।", en: "The heirs of the deceased." }],
    papers: [
      { bn: "মৃত ব্যক্তির মৃত্যু নিবন্ধন সনদ — আগে মৃত্যু নিবন্ধন করুন।", en: "The deceased's death registration certificate — register the death first." },
      { bn: "উত্তরাধিকারীদের জন্ম নিবন্ধন বা জাতীয় পরিচয়পত্রের কপি সাথে রাখুন।", en: "Bring copies of the heirs' birth registrations or national IDs." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: ["warish-cert"],
    where: [UP, UDC],
    steps: [
      { bn: "মৃত্যু নিবন্ধন না থাকলে আগে সেটি করুন।", en: "If the death isn't registered yet, do that first." },
      { bn: "ইউনিয়ন পরিষদে আবেদন করুন।", en: "Apply at the Union Parishad." },
      { bn: "ফি দিলে রসিদ নিন।", en: "If you pay a fee, take a receipt." },
    ],
    tips: [{ bn: "সব উত্তরাধিকারীর নাম ঠিকভাবে লেখা হয়েছে কিনা সনদ নেওয়ার আগে মিলিয়ে নিন।", en: "Check that every heir's name is correct before you take the certificate." }],
    source_docs: ["orgbdr-faq", "law-up-act-2009"],
  },
  {
    id: "trade-licence",
    icon: "store",
    title_bn: "ট্রেড লাইসেন্স",
    title_en: "Trade licence",
    summary_bn: "ইউনিয়নে দোকান বা ব্যবসা চালাতে ইউনিয়ন পরিষদ থেকে ট্রেড লাইসেন্স নিতে হয়।",
    summary_en: "To run a shop or business in the union you need a trade licence from the Union Parishad.",
    keywords: "ট্রেড লাইসেন্স ব্যবসা দোকান trade licence business shop",
    who: [{ bn: "ইউনিয়নের ভেতরে ব্যবসা, দোকান বা পেশা চালান এমন যে কেউ।", en: "Anyone running a business, shop or trade inside the union." }],
    papers: [{ bn: "জাতীয় পরিচয়পত্রের কপি ও ব্যবসার ঠিকানা সাথে রাখুন।", en: "Bring a copy of your national ID and the business address." }, UNKNOWN_PAPERS],
    fee_ids: ["trade-licence"],
    where: [UP, UDC],
    steps: [
      { bn: "ইউনিয়ন পরিষদে আবেদন করুন।", en: "Apply at the Union Parishad." },
      { bn: "ব্যবসার ধরন অনুযায়ী ফি দিন, রসিদ নিন।", en: "Pay the fee for your type of business and take a receipt." },
    ],
    tips: [{ bn: "ফি ব্যবসার ধরন ও ইউনিয়নের কর তফসিল অনুযায়ী আলাদা। কাতুলী ইউনিয়নের তালিকা পেলে এখানে যোগ হবে।", en: "The fee depends on the business type and the union's tax schedule. Katuli's list will be added when available." }],
    source_docs: ["law-up-act-2009"],
  },
  {
    id: "land-mutation",
    icon: "landmark",
    title_bn: "জমির নামজারি ও খতিয়ান",
    title_en: "Land mutation and records",
    summary_bn: "জমি কেনা বা ওয়ারিশসূত্রে পেলে নিজের নামে নামজারি করুন — অনলাইনে আবেদন করা যায়। মোট সরকারি ফি ৳১,১৭০।",
    summary_en: "After buying or inheriting land, transfer it to your name — you can apply online. Total official fee Tk 1,170.",
    keywords: "নামজারি মিউটেশন খতিয়ান পর্চা জমি ভূমি খাজনা mutation land record khatian namjari",
    who: [{ bn: "যিনি জমি কিনেছেন বা উত্তরাধিকারসূত্রে পেয়েছেন।", en: "Anyone who has bought or inherited land." }],
    papers: [
      { bn: "দলিল বা ওয়ারিশ সনদ, এবং আগের খতিয়ানের তথ্য।", en: "The deed or heir certificate, and details of the existing record (khatian)." },
      { bn: "জাতীয় পরিচয়পত্র।", en: "National ID." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: ["land-mutation", "khatian-certified-copy"],
    fee_note: { bn: "নামজারি: আবেদনের কোর্ট ফি ৳২০ + নোটিশ জারি ফি ৳৫০ + ডিসিআর ফি ৳১,১০০ = মোট ৳১,১৭০।", en: "Mutation: court fee Tk 20 + notice fee Tk 50 + DCR fee Tk 1,100 = Tk 1,170 total." },
    where: [
      { kind: "online", label_bn: "অনলাইনে: mutation.land.gov.bd", label_en: "Online: mutation.land.gov.bd", url: "https://mutation.land.gov.bd/" },
      { kind: "other", label_bn: "ইউনিয়ন ভূমি অফিস / উপজেলা ভূমি অফিস", label_en: "Union land office / upazila land office" },
      UDC,
    ],
    steps: [
      { bn: "অনলাইনে বা ডিজিটাল সেন্টারে নামজারির আবেদন করুন।", en: "Apply for mutation online or at the digital centre." },
      { bn: "শুধু সরকারি ফি দিন — অনলাইনে দিলে রসিদ নিজেই পাবেন।", en: "Pay only the official fee — paying online gives you a receipt automatically." },
      { bn: "শুনানির নোটিশ এলে কাগজপত্র নিয়ে হাজির হোন।", en: "If you get a hearing notice, attend with your papers." },
    ],
    tips: [{ bn: "ভূমি সেবা নিয়ে প্রশ্ন থাকলে ১৬১২২ নম্বরে ফোন করুন।", en: "For land service questions call 16122." }],
    source_docs: ["land-service-fees", "natportal-hotlines"],
  },
  {
    id: "allowance-application",
    icon: "hand",
    title_bn: "ভাতার জন্য আবেদন",
    title_en: "Applying for an allowance",
    summary_bn: "বয়স্ক, বিধবা, প্রতিবন্ধী ও অন্যান্য ভাতা — কারা পাবেন, কীভাবে নাম দেবেন।",
    summary_en: "Old-age, widow, disability and other allowances — who qualifies and how to get on the list.",
    keywords: "ভাতা আবেদন বয়স্ক বিধবা প্রতিবন্ধী allowance apply old age widow disability",
    who: [{ bn: "শর্ত মিলছে কিনা দেখতে \"ভাতা যাচাই\" ব্যবহার করুন।", en: "Use \"Check allowances\" to see if you meet the conditions." }],
    papers: [
      { bn: "জাতীয় পরিচয়পত্র (বয়সের প্রমাণ)।", en: "National ID (proof of age)." },
      { bn: "প্রতিবন্ধী ভাতার জন্য সুবর্ণ নাগরিক কার্ড।", en: "For the disability allowance: a Suborno Nagorik card." },
      UNKNOWN_PAPERS,
    ],
    fee_ids: [],
    fee_note: { bn: "আবেদনে কোনো টাকা লাগার কথা নয়।", en: "Applying should not cost anything." },
    where: [UP, { kind: "other", label_bn: "উপজেলা সমাজসেবা কার্যালয়, টাঙ্গাইল সদর", label_en: "Upazila Social Services Office, Tangail Sadar" }],
    steps: [
      { bn: "ওয়ার্ড সদস্যকে জানান এবং ওয়ার্ড সভায় নাম দিন — ওয়ার্ড সভা উপকারভোগীদের অগ্রাধিকার তালিকা তৈরি করে।", en: "Tell your ward member and give your name at the ward shava — it prepares the beneficiary priority list." },
      { bn: "ইউনিয়ন পরিষদ বা উপজেলা সমাজসেবা কার্যালয়ে আবেদন জমা দিন।", en: "Submit the application at the Union Parishad or the upazila social services office." },
      { bn: "যাচাইয়ের পর চূড়ান্ত তালিকা হয়; বরাদ্দ সীমিত, তাই অপেক্ষা করতে হতে পারে।", en: "The final list is made after verification; places are limited, so there may be a wait." },
    ],
    tips: [{ bn: "অনিয়ম প্রমাণ না হলে ওয়ার্ড সভার অগ্রাধিকার তালিকা ইউনিয়ন পরিষদ বদলাতে পারে না (ইউপি আইন, ধারা ৬)।", en: "The UP cannot change the ward shava's priority list unless an irregularity is proven (UP Act, s.6)." }],
    source_docs: ["dss-allowances-2026-27", "law-up-act-2009"],
  },
];
