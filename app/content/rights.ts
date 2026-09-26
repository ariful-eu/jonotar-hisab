export type RightsPoint = { bn: string; en: string };
export type RightsSection = { heading_bn: string; heading_en: string; points: RightsPoint[] };
export type RightsLink = { label_bn: string; label_en: string; href: string };
export type RightsTopic = { key: "rti" | "ward-shava" | "open-budget" | "complain"; title_bn: string; title_en: string; summary_bn: string; summary_en: string; sections: RightsSection[]; links: RightsLink[]; source_docs: string[] };

export const RIGHTS_TOPICS: RightsTopic[] = [
  {
    key: "rti",
    title_bn: "তথ্য চাওয়ার অধিকার",
    title_en: "Your right to information",
    summary_bn: "ইউনিয়ন পরিষদের বাজেট, প্রকল্প, ভাতাভোগীর সংখ্যা — যেকোনো তথ্য চাওয়ার আইনি অধিকার আপনার আছে।",
    summary_en: "You have a legal right to ask the Union Parishad for any information — budgets, projects, beneficiary numbers.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "যেকোনো নাগরিক ইউনিয়ন পরিষদের তথ্য পাওয়ার অধিকারী (স্থানীয় সরকার (ইউনিয়ন পরিষদ) আইন ২০০৯, ধারা ৭৮)।", en: "Every citizen has the right to information about the Union Parishad (UP Act 2009, s.78)." },
          { bn: "লিখিতভাবে, ইমেইলে বা ফরম 'ক'-তে আবেদন করা যায়; ফরম না থাকলে সাদা কাগজেও চলবে (তথ্য অধিকার আইন ২০০৯, ধারা ৮)।", en: "You can apply in writing, by email, or on Form 'Ka'; plain paper is fine if no form is available (RTI Act 2009, s.8)." },
          { bn: "২০ কার্যদিবসের মধ্যে তথ্য দেওয়ার কথা; একাধিক দপ্তর জড়িত হলে ৩০ কার্যদিবস। জীবন-মৃত্যু, গ্রেপ্তার বা জেল থেকে মুক্তি সংক্রান্ত তথ্য ২৪ ঘণ্টার মধ্যে (ধারা ৯)।", en: "Information must be given within 20 working days (30 if several units are involved); life, death, arrest or release information within 24 hours (s.9)." },
          { bn: "দিতে না পারলে ১০ কার্যদিবসের মধ্যে কারণসহ লিখিতভাবে জানাতে হবে। কোনো উত্তর না দেওয়া মানে তথ্য দিতে অস্বীকার (ধারা ৯)।", en: "A refusal must come within 10 working days, in writing, with reasons. No answer counts as a refusal (s.9)." },
          { bn: "সময়মতো তথ্য না দিলে ইউপি সচিবের দিনে ৫০ টাকা হারে জরিমানা হতে পারে (ইউপি আইন ধারা ৮০; তথ্য অধিকার আইন ধারা ২৭)।", en: "An officer who delays can be fined Tk 50 per day (UP Act s.80; RTI Act s.27)." },
        ],
      },
      {
        heading_bn: "ধাপে ধাপে", heading_en: "Step by step",
        points: [
          { bn: "নিচের ফরমে কী তথ্য চান বেছে নিন, নাম-ঠিকানা লিখুন, প্রিন্ট করে সই করুন। আপনার তথ্য শুধু আপনার ফোনেই থাকে।", en: "Choose what you want below, fill in your name and address, print and sign. Your details stay on your phone." },
          { bn: "ইউনিয়ন পরিষদ কার্যালয়ে দায়িত্বপ্রাপ্ত কর্মকর্তার (সাধারণত ইউপি সচিব) কাছে জমা দিন। একটি ফটোকপিতে 'গ্রহণ করা হলো' লিখিয়ে সই ও তারিখ নিয়ে রাখুন।", en: "Submit it at the UP office to the designated officer (usually the UP Secretary). Get a photocopy stamped 'received' with a signature and date." },
          { bn: "আবেদন করতে ফি লাগে না; কপি দেওয়ার জন্য পৃষ্ঠাপ্রতি সামান্য খরচ নেওয়া যায়।", en: "Applying is free; a small per-page cost can be charged for copies." },
          { bn: "২০ কার্যদিবসে উত্তর না পেলে ৩০ দিনের মধ্যে আপিল কর্তৃপক্ষের কাছে আপিল করুন; ১৫ দিনে নিষ্পত্তি হওয়ার কথা (ধারা ২৪)। আপিল কর্তৃপক্ষ কে, তা ইউপির নোটিশ বোর্ডে থাকার কথা।", en: "No answer in 20 working days? Appeal within 30 days to the appellate authority, who must decide in 15 days (s.24). The UP notice board should say who that is." },
          { bn: "আপিলেও সমাধান না হলে ৩০ দিনের মধ্যে তথ্য কমিশনে অভিযোগ করুন (ধারা ২৫)।", en: "Still nothing? Complain to the Information Commission within 30 days (s.25)." },
        ],
      },
    ],
    links: [{ label_bn: "তথ্য কমিশন", label_en: "Information Commission", href: "https://infocom.gov.bd/" }],
    source_docs: ["law-up-act-2009", "law-rti-act-2009"],
  },
  {
    key: "ward-shava",
    title_bn: "ওয়ার্ড সভা: আপনার ওয়ার্ডের সংসদ",
    title_en: "Ward shava: your ward's assembly",
    summary_bn: "আপনার ওয়ার্ডের সব ভোটার ওয়ার্ড সভার সদস্য। কোন রাস্তা আগে হবে, কারা ভাতা পাবেন — এখানেই ঠিক হওয়ার কথা।",
    summary_en: "Every voter in your ward is a member. Which road comes first and who gets allowances is meant to be decided here.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "ওয়ার্ডের ভোটার তালিকার সবাই ওয়ার্ড সভার সদস্য (ইউপি আইন ২০০৯, ধারা ৪)।", en: "Everyone on the ward's voter list is a member (UP Act 2009, s.4)." },
          { bn: "বছরে অন্তত ২টি সভা হবে, একটি বার্ষিক সভা। সভার অন্তত ৭ দিন আগে প্রকাশ্য নোটিশ দিতে হবে। কোরাম: ওয়ার্ডের ভোটারের ৫% (ধারা ৫)।", en: "At least 2 meetings a year, one of them the annual meeting, with public notice 7 days before. Quorum: 5% of the ward's voters (s.5)." },
          { bn: "বার্ষিক সভায় ওয়ার্ড সদস্যকে আগের বছরের কাজ ও খরচের হিসাব দিতে হয় (ধারা ৫)।", en: "At the annual meeting the ward member must account for the past year's work and spending (s.5)." },
          { bn: "ওয়ার্ড সভা প্রকল্পের অগ্রাধিকার ঠিক করে, এবং সরকারি কর্মসূচির উপকারভোগীর চূড়ান্ত অগ্রাধিকার তালিকা তৈরি করে। অনিয়ম প্রমাণ না হলে ইউনিয়ন পরিষদ এই তালিকা বদলাতে পারে না (ধারা ৬(৭))।", en: "The ward shava sets project priorities and makes the final priority list of beneficiaries. The UP cannot change that list unless an irregularity is proven (s.6(7))." },
          { bn: "বাজেটের খাতওয়ারি বরাদ্দ, প্রাক্কলন ও কেনাকাটার খরচ ওয়ার্ডের প্রকাশ্য স্থানে বোর্ডে লিখে রাখার কথা; নিরীক্ষা প্রতিবেদন ওয়ার্ড সভায় উপস্থাপনের কথা (ধারা ৬(২), ৬(৩))।", en: "Budget allocations, estimates and purchase costs must be written on a public board in the ward, and audit reports presented at the ward shava (s.6(2), 6(3))." },
          { bn: "ওয়ার্ড সভার আগাম বা পরবর্তী অনুমোদন ছাড়া করা খরচের দায় যিনি খরচ করেছেন তাঁর ব্যক্তিগত (ধারা ৭(৪))।", en: "Spending without the ward shava's approval, before or after, is the personal liability of whoever spent it (s.7(4))." },
        ],
      },
      {
        heading_bn: "আপনি যা করতে পারেন", heading_en: "What you can do",
        points: [
          { bn: "ওয়ার্ড সদস্যকে জিজ্ঞেস করুন: এ বছরের ওয়ার্ড সভা কবে?", en: "Ask your ward member: when is this year's ward shava?" },
          { bn: "সভায় গিয়ে জিজ্ঞেস করুন: গত বছরের প্রকল্পগুলোর খরচ কত, কাজ কোথায়?", en: "At the meeting, ask: what did last year's projects cost, and where is the work?" },
          { bn: "সভা না হলে কার্যবিবরণী চেয়ে তথ্য অধিকার আবেদন করুন, অথবা ইউএনওকে লিখিত জানান।", en: "If no meeting is held, request the minutes under RTI or write to the UNO." },
        ],
      },
    ],
    links: [],
    source_docs: ["law-up-act-2009"],
  },
  {
    key: "open-budget",
    title_bn: "প্রকাশ্য বাজেট অধিবেশন",
    title_en: "The open budget session",
    summary_bn: "ইউনিয়ন পরিষদের বাজেট এলাকাবাসীর সামনে প্রকাশ্য সভায় উপস্থাপন করার কথা। আপনি সেখানে প্রশ্ন করতে পারেন।",
    summary_en: "The UP budget must be presented at a public meeting in front of residents. You can ask questions there.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "অর্থবছর শুরুর (১ জুলাই) অন্তত ৬০ দিন আগে, অর্থাৎ মোটামুটি ২ মের মধ্যে, ওয়ার্ড সভার অগ্রাধিকার মেনে বাজেট তৈরি করতে হবে (ইউপি আইন ২০০৯, ধারা ৫৭)।", en: "The budget must be prepared at least 60 days before the fiscal year starts (1 July), i.e. by about 2 May, following ward shava priorities (UP Act 2009, s.57)." },
          { bn: "বাজেট প্রকাশ্য বাজেট অধিবেশনে স্থায়ী কমিটি ও এলাকাবাসীর উপস্থিতিতে উপস্থাপন করতে হবে।", en: "It must be presented at a public budget session with the standing committees and local people present." },
          { bn: "পাসের পর কপি উপজেলা নির্বাহী অফিসারের (ইউএনও) কাছে যায়; তিনি ৩০ দিনের মধ্যে সংশোধন করতে পারেন (ধারা ৫৭(৪))।", en: "Once passed, a copy goes to the UNO, who may correct it within 30 days (s.57(4))." },
          { bn: "বছর শেষে চূড়ান্ত হিসাব প্রকাশ্য বাজেট অধিবেশনে উপস্থাপন করে ৬০ দিনের মধ্যে ইউএনওর কাছে পাঠাতে হয় (ধারা ৫৮)।", en: "At year end, the final accounts must be presented at the open session and sent to the UNO within 60 days (s.58)." },
        ],
      },
      {
        heading_bn: "সভায় যা জিজ্ঞেস করবেন", heading_en: "Questions to ask at the session",
        points: [
          { bn: "গত বছর কত টাকা এসেছিল আর কত খরচ হয়েছে? চূড়ান্ত হিসাব কোথায়?", en: "How much came in last year and how much was spent? Where are the final accounts?" },
          { bn: "আমার ওয়ার্ডে এ বছর কোন প্রকল্প, কত টাকা, কে বাস্তবায়ন করবে?", en: "Which projects are planned in my ward this year, for how much, and who will implement them?" },
          { bn: "বসতবাড়ি কর কত আদায় হয়েছে, কর আদায়কারী কত কমিশন পেয়েছেন?", en: "How much holding tax was collected, and what commission did the collectors get?" },
          { bn: "বাজেটের কপি নোটিশ বোর্ডে ও ওয়েবসাইটে কবে দেওয়া হবে?", en: "When will a copy of the budget be posted on the notice board and the website?" },
        ],
      },
    ],
    links: [],
    source_docs: ["law-up-act-2009"],
  },
  {
    key: "complain",
    title_bn: "কোথায় অভিযোগ করবেন",
    title_en: "Where to complain",
    summary_bn: "ঘুষ চাওয়া, সেবা না পাওয়া বা তালিকায় অনিয়ম — সরকারি মাধ্যমে অভিযোগ করুন এবং নিজের কাছে কপি রাখুন।",
    summary_en: "Asked for a bribe, denied a service, or a list was manipulated? Use the official channels and keep a copy.",
    sections: [
      {
        heading_bn: "অভিযোগের পথ", heading_en: "Channels",
        points: [
          { bn: "দুদক হটলাইন ১০৬: টোল-ফ্রি, সকাল ৯টা–বিকাল ৫টা। ঘুষ ও দুর্নীতির অভিযোগের জন্য।", en: "ACC hotline 106: toll-free, 9am–5pm. For bribery and corruption complaints." },
          { bn: "অনলাইন অভিযোগ ব্যবস্থা (GRS, grs.gov.bd): বিনামূল্যে; ৩০ কার্যদিবসে নিষ্পত্তির কথা। তথ্য অধিকার বিষয়ক অভিযোগ এখানে নয়।", en: "Online Grievance Redress System (GRS, grs.gov.bd): free; should be resolved in 30 working days. Not for RTI complaints." },
          { bn: "জাতীয় হেল্পলাইন ৩৩৩: ২৪ ঘণ্টা; প্রতি মিনিট ৬০ পয়সা। তথ্য জানতে ও ইউএনও/ডিসির কাছে অভিযোগ পৌঁছাতে।", en: "National helpline 333: 24/7; 60 paisa per minute. For information and to reach the UNO/DC." },
          { bn: "উপজেলা নির্বাহী অফিসার (ইউএনও), টাঙ্গাইল সদর: লিখিত অভিযোগ দিন, রিসিভ কপি রাখুন।", en: "Upazila Nirbahi Officer (UNO), Tangail Sadar: submit a written complaint and keep a stamped copy." },
          { bn: "তথ্য না পেলে: আপিল কর্তৃপক্ষ, তারপর তথ্য কমিশন।", en: "Information refused: appellate authority, then the Information Commission." },
        ],
      },
      {
        heading_bn: "নিরাপদ থাকুন", heading_en: "Stay safe",
        points: [
          { bn: "ফেসবুক বা অন্য কোথাও প্রকাশ্যে কারো নাম ধরে অভিযোগ পোস্ট করবেন না — আইনি ঝুঁকি আছে। সরকারি মাধ্যম ব্যবহার করুন।", en: "Don't post accusations naming people on Facebook or elsewhere — there is legal risk. Use official channels." },
          { bn: "প্রতিটি আবেদনের কপি, রসিদ ও তারিখ সংরক্ষণ করুন। যা দেখেছেন শুধু তা-ই লিখুন।", en: "Keep copies, receipts and dates of everything you submit. Write only what you saw." },
        ],
      },
    ],
    links: [
      { label_bn: "দুদক ১০৬-এ কল করুন", label_en: "Call ACC 106", href: "tel:106" },
      { label_bn: "GRS-এ অভিযোগ", label_en: "Complain on GRS", href: "https://www.grs.gov.bd/" },
      { label_bn: "৩৩৩-এ কল করুন", label_en: "Call 333", href: "tel:333" },
    ],
    source_docs: ["law-rti-act-2009", "grs-portal"],
  },
];
