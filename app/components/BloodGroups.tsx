import { useEffect, useState } from "react";
import { BLOOD_GROUPS, canGiveTo, canReceiveFrom, groupLabel, parseGroupsCsv, type BloodGroup, type GroupAvailability } from "../lib/blood";
import { useT } from "../lib/i18n";

/** Which groups have donors in the union right now. Read in the browser from the owner's published sheet tab. */
export function BloodAvailability({ csvUrl }: { csvUrl: string }) {
  const t = useT();
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; groups?: GroupAvailability }>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch(csvUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => alive && setState({ status: "ok", groups: parseGroupsCsv(text) }))
      .catch(() => alive && setState({ status: "error" }));
    return () => { alive = false; };
  }, [csvUrl]);

  if (state.status === "loading") return <p className="muted" role="status">{t("তথ্য আনা হচ্ছে…", "Loading…")}</p>;
  if (state.status === "error" || !state.groups) {
    return <p className="muted" role="status">{t("এখন তথ্য আনা যাচ্ছে না — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন। জরুরি হলে নিচের হাসপাতালে কল করুন।", "Can't load this right now — check your connection and try again. If it's urgent, call the hospital below.")}</p>;
  }
  const groups = state.groups;
  return (
    <>
      <ul className="blood-grid" aria-label={t("রক্তের গ্রুপ", "Blood groups")}>
        {BLOOD_GROUPS.map((g) => {
          const v = groups[g];
          return (
            <li key={g} className={`blood-cell${v === true ? " is-yes" : ""}`}>
              <span className="blood-group">{groupLabel(g)}</span>
              <span className="blood-state">{v === true ? t("আছে", "Available") : v === false ? t("এখনো নেই", "None yet") : t("তথ্য নেই", "No data")}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted">{t("তালিকা কয়েক মিনিট পুরোনো হতে পারে। রক্তদাতার নাম বা নম্বর এখানে দেখানো হয় না।", "This may be a few minutes old. Donors' names and numbers are never shown here.")}</p>
    </>
  );
}

/** "Which group can give to whom", for one picked group. Pure client state. */
export function CompatibilityPicker() {
  const t = useT();
  const [g, setG] = useState<BloodGroup | null>(null);
  return (
    <>
      <div className="chips" role="group" aria-label={t("আপনার বা রোগীর গ্রুপ বেছে নিন", "Pick your or the patient's group")}>
        {BLOOD_GROUPS.map((x) => (
          <button key={x} type="button" className={`chip chip-btn${g === x ? " active" : ""}`} aria-pressed={g === x} onClick={() => setG(x)}>{groupLabel(x)}</button>
        ))}
      </div>
      {g ? (
        <dl className="kv compat" aria-live="polite">
          <dt>{t(`${groupLabel(g)} রোগী রক্ত নিতে পারেন`, `A ${groupLabel(g)} patient can receive from`)}</dt>
          <dd><strong>{canReceiveFrom(g).map(groupLabel).join(", ")}</strong></dd>
          <dt>{t(`${groupLabel(g)} রক্তদাতা দিতে পারেন`, `A ${groupLabel(g)} donor can give to`)}</dt>
          <dd><strong>{canGiveTo(g).map(groupLabel).join(", ")}</strong></dd>
        </dl>
      ) : <p className="muted">{t("একটি গ্রুপে চাপ দিন।", "Tap a group.")}</p>}
      <p className="muted">{t("এটি লোহিত কণিকার (সাধারণ রক্ত) সাধারণ নিয়ম। কোন রক্ত দেওয়া হবে তা চূড়ান্ত করবেন হাসপাতালের ডাক্তার, ক্রস-ম্যাচ পরীক্ষার পর।", "This is the general rule for red cells (ordinary blood). The hospital doctor decides after a cross-match test.")}</p>
    </>
  );
}
