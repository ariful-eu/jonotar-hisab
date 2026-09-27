import { useEffect, useState } from "react";
import { buildRtiLetter } from "../lib/rti";
import { useFmt, useT } from "../lib/i18n";

export type RtiItem = { id: string; requirement_bn: string; rti_request_bn: string };

export function RtiForm({ items, union }: { items: RtiItem[]; union: { name_bn: string; upazila_bn: string; district_bn: string } }) {
  const t = useT();
  const f = useFmt();
  const [itemId, setItemId] = useState(items[0]?.id ?? "custom");
  const [custom, setCustom] = useState("");
  const [applicant, setApplicant] = useState({ name: "", guardian: "", address: "", phone: "" });
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("item");
    if (wanted && items.some((i) => i.id === wanted)) setItemId(wanted);
  }, [items]);
  const information = itemId === "custom" ? custom : items.find((i) => i.id === itemId)?.rti_request_bn ?? "";
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const letter = buildRtiLetter({ unionName: union.name_bn, upazila: union.upazila_bn, district: union.district_bn, information, applicant, dateText: today ? f.date(today) : "" });
  const field = (k: keyof typeof applicant, label: string) => (
    <label>{label}<input value={applicant[k]} onChange={(e) => setApplicant({ ...applicant, [k]: e.target.value })} autoComplete="off" /></label>
  );

  return (
    <div className="rti-page">
      <section className="card form-grid no-print">
        <h2 className="h3">{t("আবেদনপত্র তৈরি করুন", "Make your application")}</h2>
        <p className="muted">{t("আপনার লেখা তথ্য শুধু আপনার ফোনেই থাকে — কোথাও পাঠানো হয় না।", "What you type stays on your phone — it is not sent anywhere.")}</p>
        <label>{t("কোন তথ্য চান", "What do you want")}
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.requirement_bn}</option>)}
            <option value="custom">{t("অন্য কিছু (নিজে লিখুন)", "Something else (write it)")}</option>
          </select>
        </label>
        {itemId === "custom" ? <label>{t("তথ্যের বিবরণ", "Describe the information")}<textarea rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} /></label> : null}
        {field("name", t("আপনার নাম", "Your name"))}
        {field("guardian", t("পিতা/মাতা/স্বামীর নাম", "Father/mother/husband's name"))}
        {field("address", t("ঠিকানা", "Address"))}
        {field("phone", t("মোবাইল (ঐচ্ছিক)", "Mobile (optional)"))}
        <p className="muted">{t("ফাঁকা রাখলে ডট-লাইন থাকবে, প্রিন্টের পর হাতে লিখতে পারবেন।", "Leave blank to get dotted lines you can fill in by hand after printing.")}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>{t("আবেদনপত্র প্রিন্ট করুন", "Print the application")}</button>
      </section>
      <article className="letter" lang="bn" aria-label={t("আবেদনপত্রের নমুনা", "Application preview")}>
        <p>{letter.to.map((line) => <span key={line}>{line}<br /></span>)}</p>
        <p><strong>{letter.subject}</strong></p>
        {letter.fields.map((x) => <div key={x.label} className="field"><span>{x.label}</span><span>{x.value}</span></div>)}
        <p>{letter.closing}</p>
        <p style={{ marginTop: "2.5rem" }}>আবেদনকারীর স্বাক্ষর: ........................................</p>
      </article>
    </div>
  );
}
