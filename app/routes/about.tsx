import { useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("আমাদের সম্পর্কে", "এটি একটি স্বাধীন নাগরিক উদ্যোগ — সরকারি ওয়েবসাইট নয়। আমরা কীভাবে তথ্য সংগ্রহ করি।");
}

export async function loader() {
  const ds = loadDataset();
  return { portal: ds.union.portal_url, whatsapp: ds.union.maintainer.whatsapp, note: ds.union.maintainer.note_bn };
}

export default function About() {
  const { portal, whatsapp, note } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <h1>{t("আমাদের সম্পর্কে", "About")}</h1>
      <section className="card">
        <h2 className="h3">{t("আমরা কারা", "Who we are")}</h2>
        <p>{t("“জনতার হিসাব” কাতুলী ইউনিয়নের নাগরিকদের একটি স্বাধীন, অরাজনৈতিক উদ্যোগ। এটি সরকারি ওয়েবসাইট নয়, ইউনিয়ন পরিষদ বা কোনো সরকারি দপ্তরের সাথে যুক্ত নয়। লক্ষ্য একটাই: জনগণের টাকার হিসাব সবার কাছে সহজ করে পৌঁছে দেওয়া।", "“Jonotar Hisab” (The People's Account) is an independent, non-partisan initiative by citizens of Katuli Union. It is not a government website and is not affiliated with the Union Parishad or any government office. Our only aim is to make public money easy for everyone to follow.")}</p>
        <p>{t("ইউনিয়ন পরিষদের সরকারি ওয়েবসাইট: ", "The Union Parishad's official website: ")}<a href={portal} target="_blank" rel="noopener">{portal}</a></p>
      </section>
      <section className="card">
        <h2 className="h3">{t("তথ্য কোথা থেকে আসে", "Where the data comes from")}</h2>
        <ul>
          <li><span className="chip chip-union">{t("ইউনিয়নের নথি", "Union document")}</span> {t("ইউনিয়ন পরিষদের প্রকাশিত বাজেট, নোটিশ ও তালিকা।", "Budgets, notices and lists published by the Union Parishad.")}</li>
          <li><span className="chip chip-upstream">{t("অন্য সরকারি অফিসের নথি", "Other government office")}</span> {t("উপজেলা, জেলা ও মন্ত্রণালয়ের বরাদ্দ তালিকা — ইউনিয়ন নিজে প্রকাশ না করলে।", "Allocation lists from the upazila, district and ministries — used when the union itself has not published.")}</li>
          <li><span className="chip chip-observed">{t("স্বেচ্ছাসেবকের পর্যবেক্ষণ", "Volunteer observation")}</span> {t("স্বেচ্ছাসেবকেরা নিজে গিয়ে যা দেখেছেন, তারিখ ও ছবিসহ।", "What volunteers saw in person, with date and photos.")}</li>
        </ul>
        <p>{t("প্রতিটি সংখ্যার পাশে উৎস-নথির লিংক আছে, আর প্রতিটি নথির কপি আমরা সংরক্ষণ করি।", "Every figure links to its source document, and we keep a copy of each document.")}</p>
      </section>
      <section className="card">
        <h2 className="h3">{t("গুরুত্বপূর্ণ সতর্কতা", "Important disclaimer")}</h2>
        <p>{t("এখানে দেখানো কোনো অমিল বা ফাঁক মানেই অনিয়ম বা অপরাধের প্রমাণ নয় — এটি প্রশ্ন করার একটি কারণ মাত্র। আমরা কাউকে অভিযুক্ত করি না। ভুল পেলে জানান, প্রমাণসহ সংশোধন করা হবে।", "A discrepancy or gap shown here is not proof of wrongdoing — only a reason to ask questions. We accuse no one. If you find a mistake, tell us and we will correct it with evidence.")}</p>
      </section>
      <section className="card">
        <h2 className="h3">{t("ইউনিয়ন পরিষদের জবাবের অধিকার", "The Union Parishad's right of reply")}</h2>
        <p>{t("ইউনিয়ন পরিষদ কোনো তথ্য সংশোধন করতে বা বক্তব্য দিতে চাইলে আমরা তা সংশ্লিষ্ট পাতায় হুবহু প্রকাশ করব।", "If the Union Parishad wishes to correct any information or respond, we will publish its response verbatim on the relevant page.")}</p>
        {whatsapp ? <p><a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">{t("যোগাযোগ (হোয়াটসঅ্যাপ)", "Contact (WhatsApp)")}</a></p> : null}
        {note ? <p>{note}</p> : null}
      </section>
    </>
  );
}
