import { MessageCircle, Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

export function ShareButtons({ title, poster }: { title: string; poster?: string }) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`.trim())}`;
  return (
    <section className="card share-card no-print" aria-labelledby="share-h">
      <h2 id="share-h" className="h3">{t("অন্যদের জানান", "Tell others")}</h2>
      <p className="muted">{t("এই পাতাটি পরিবার, প্রতিবেশী বা গ্রুপে পাঠান — যত বেশি মানুষ জানবে, তত বেশি প্রশ্ন উঠবে।", "Send this page to family, neighbours or a group — the more people know, the more questions get asked.")}</p>
      <div className="share">
        <a className="btn btn-primary" href={wa} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden />{t("হোয়াটসঅ্যাপে পাঠান", "Send on WhatsApp")}</a>
        {canShare ? (
          <button type="button" className="btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>
            <Share2 size={18} aria-hidden />{t("অন্য অ্যাপে শেয়ার", "Share elsewhere")}
          </button>
        ) : null}
        {poster ? (
          <Link className="btn" to={poster}><Printer size={18} aria-hidden />{t("নোটিশ বোর্ডের পোস্টার", "Notice-board poster")}</Link>
        ) : (
          <button type="button" className="btn" onClick={() => window.print()}><Printer size={18} aria-hidden />{t("এই পাতা প্রিন্ট করুন", "Print this page")}</button>
        )}
      </div>
    </section>
  );
}
