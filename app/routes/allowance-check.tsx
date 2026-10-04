import { CheckCircle2, HelpCircle, Info } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { checkEligibility, type Answers } from "../lib/eligibility";
import { toEnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("ভাতা যাচাই — আমি কি পাব?", "কয়েকটি প্রশ্নের উত্তর দিয়ে দেখুন কোন সরকারি ভাতা আপনি পেতে পারেন, কত টাকা, আর কীভাবে আবেদন করবেন।");
}

export async function loader() {
  return { allowances: loadDataset().allowances };
}

type Form = { age: string; gender: Answers["gender"] | ""; income: "low" | "high" | "unknown" | ""; widowed: boolean; disabilityCard: boolean; motherOrPregnant: boolean };

export default function AllowanceCheck() {
  const { allowances } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const [form, setForm] = useState<Form>({ age: "", gender: "", income: "", widowed: false, disabilityCard: false, motherOrPregnant: false });
  const age = Number(toEnDigits(form.age));
  const ready = form.age.trim() !== "" && Number.isFinite(age) && age > 0 && age < 130 && form.gender !== "" && form.income !== "";
  const results = ready
    ? checkEligibility({ age, gender: form.gender as Answers["gender"], lowIncome: form.income === "unknown" ? null : form.income === "low", widowed: form.widowed, disabilityCard: form.disabilityCard, motherOrPregnant: form.motherOrPregnant }, allowances)
    : [];
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const radio = (name: keyof Form, value: string, label: string) => (
    <label className="choice">
      <input type="radio" name={name} value={value} checked={form[name] === value} onChange={() => set(name, value as never)} />
      <span>{label}</span>
    </label>
  );

  return (
    <>
      <p className="no-print"><Link to="/allowances">← {t("ভাতা ও সহায়তা", "Allowances")}</Link></p>
      <h1>{t("আমি কি ভাতা পাব?", "Which allowances might I get?")}</h1>
      <p className="intro">{t("কয়েকটি প্রশ্নের উত্তর দিন — সাথে সাথে দেখবেন কোন ভাতা পেতে পারেন। আপনার উত্তর শুধু আপনার ফোনেই থাকে, কোথাও পাঠানো হয় না।", "Answer a few questions to see which allowances you may get. Your answers stay on your phone and are not sent anywhere.")}</p>

      <form className="card form-grid checker" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="age">{t("১. আপনার (বা যার জন্য দেখছেন তার) বয়স কত?", "1. Age of the person")}</label>
        <input id="age" inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder={t("যেমন: ৬৫", "e.g. 65")} />

        <fieldset>
          <legend>{t("২. লিঙ্গ", "2. Gender")}</legend>
          {radio("gender", "female", t("নারী", "Woman"))}
          {radio("gender", "male", t("পুরুষ", "Man"))}
          {radio("gender", "other", t("অন্যান্য", "Other"))}
        </fieldset>

        <fieldset>
          <legend>{t("৩. পরিবারের বছরে মোট আয় কি ৪৫,০০০ টাকার কম?", "3. Is the yearly income under Tk 45,000?")}</legend>
          {radio("income", "low", t("হ্যাঁ, কম", "Yes, less"))}
          {radio("income", "high", t("না, বেশি", "No, more"))}
          {radio("income", "unknown", t("জানি না", "Not sure"))}
        </fieldset>

        <fieldset>
          <legend>{t("৪. নিচের কোনোটি আপনার ক্ষেত্রে সত্য হলে টিক দিন", "4. Tick any that apply")}</legend>
          {form.gender === "female" ? (
            <label className="choice"><input type="checkbox" checked={form.widowed} onChange={(e) => set("widowed", e.target.checked)} /><span>{t("বিধবা বা স্বামী পরিত্যক্তা", "Widowed or deserted")}</span></label>
          ) : null}
          <label className="choice"><input type="checkbox" checked={form.disabilityCard} onChange={(e) => set("disabilityCard", e.target.checked)} /><span>{t("প্রতিবন্ধিতার কার্ড (সুবর্ণ নাগরিক কার্ড) আছে", "Has a disability (Suborno Nagorik) card")}</span></label>
          {form.gender !== "male" ? (
            <label className="choice"><input type="checkbox" checked={form.motherOrPregnant} onChange={(e) => set("motherOrPregnant", e.target.checked)} /><span>{t("গর্ভবতী বা ছোট শিশুর মা", "Pregnant or mother of a young child")}</span></label>
          ) : null}
        </fieldset>
      </form>

      <section aria-live="polite" aria-labelledby="res-h">
        <h2 id="res-h">{t("ফলাফল", "Result")}</h2>
        {!ready ? (
          <p className="muted">{t("ওপরের ১–৩ নম্বর প্রশ্নের উত্তর দিলে ফলাফল দেখাবে।", "Answer questions 1–3 to see the result.")}</p>
        ) : results.length === 0 ? (
          <div className="card"><p>{t("এই উত্তরগুলো অনুযায়ী তালিকার কোনো ভাতার শর্ত মিলছে না। তবে অন্য সহায়তা (যেমন ভিজিএফ, ত্রাণ) থাকতে পারে — ওয়ার্ড সদস্য বা ইউনিয়ন পরিষদে জিজ্ঞেস করুন।", "These answers don't match the conditions of the listed allowances. Other support (e.g. VGF, relief) may exist — ask your ward member or the Union Parishad.")}</p></div>
        ) : (
          results.map((r) => (
            <div key={r.programme} className={`card result result-${r.level}`}>
              <h3>{r.level === "likely" ? <CheckCircle2 size={22} aria-hidden /> : <HelpCircle size={22} aria-hidden />} {f.lang === "bn" ? r.row.name_bn : r.row.name_en}</h3>
              <p className="fee">{r.monthly !== null ? t(`${f.takaFull(r.monthly)} / মাস`, `${f.takaFull(r.monthly)} / month`) : r.row.payment_note_bn ?? ""}</p>
              <p>{r.level === "likely" ? t("আপনার উত্তর অনুযায়ী শর্ত মিলছে — আবেদন করতে পারেন।", "Your answers match the conditions — you can apply.") : t("আয়ের শর্ত মিললে পেতে পারেন — আবেদনের সময় আয় যাচাই হবে।", "You may qualify if the income condition is met — it is checked when you apply.")}</p>
              <p className="muted">{f.lang === "bn" ? r.row.eligibility_bn : r.row.eligibility_en}</p>
            </div>
          ))
        )}
        {ready ? (
          <div className="info-note">
            <Info size={20} aria-hidden />
            <p>
              {t("এটি শুধু একটি প্রাথমিক ধারণা। কারা ভাতা পাবেন তা ওয়ার্ড সভা ও ইউনিয়ন কমিটি ঠিক করে, আর বরাদ্দ সীমিত থাকে। ", "This is only a first indication. The ward shava and union committee decide who receives allowances, and places are limited. ")}
              <Link to="/services/allowance-application">{t("কীভাবে আবেদন করবেন দেখুন →", "See how to apply →")}</Link>
            </p>
          </div>
        ) : null}
      </section>
    </>
  );
}
