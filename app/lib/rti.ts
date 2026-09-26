export type RtiApplicant = { name: string; guardian: string; address: string; phone: string };
export type RtiLetter = { to: string[]; subject: string; fields: { label: string; value: string }[]; closing: string };

export const RTI_BLANK = "........................................";

export function buildRtiLetter(o: { unionName: string; upazila: string; district: string; information: string; applicant: RtiApplicant; dateText: string }): RtiLetter {
  const v = (s: string) => (s.trim() === "" ? RTI_BLANK : s.trim());
  const a = o.applicant;
  return {
    to: ["বরাবর", "দায়িত্বপ্রাপ্ত কর্মকর্তা (তথ্য প্রদান)", `${o.unionName} ইউনিয়ন পরিষদ`, `${o.upazila}, ${o.district}`],
    subject: "বিষয়: তথ্য অধিকার আইন, ২০০৯-এর ধারা ৮ অনুযায়ী তথ্য প্রাপ্তির আবেদন (ফরম 'ক')",
    fields: [
      { label: "১. আবেদনকারীর নাম", value: v(a.name) },
      { label: "   পিতা/মাতা/স্বামীর নাম", value: v(a.guardian) },
      { label: "   ঠিকানা", value: v(a.address) },
      { label: "   মোবাইল (যদি থাকে)", value: v(a.phone) },
      { label: "২. কী ধরনের তথ্য চাওয়া হচ্ছে", value: v(o.information) },
      { label: "৩. কোন পদ্ধতিতে তথ্য পেতে চান", value: "ছাপানো/ফটোকপি" },
      { label: "৪. তথ্য গ্রহণকারীর নাম ও ঠিকানা", value: a.name.trim() && a.address.trim() ? `${a.name.trim()}, ${a.address.trim()}` : RTI_BLANK },
      { label: "৫. সহায়তাকারীর নাম ও ঠিকানা (প্রযোজ্য হলে)", value: "প্রযোজ্য নয়" },
      { label: "৬. আবেদনের তারিখ", value: v(o.dateText) },
    ],
    closing: "উপরোক্ত তথ্য আইনে নির্ধারিত সময়ের (২০ কার্যদিবস) মধ্যে প্রদানের জন্য অনুরোধ করছি। প্রযোজ্য ফি পরিশোধে প্রস্তুত আছি।",
  };
}
