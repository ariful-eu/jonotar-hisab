import { Check, Link2, MessageCircle, Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21h3.2Z" />
    </svg>
  );
}

export function ShareButtons({ title, poster }: { title: string; poster?: string }) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(`${title} ${url}`.trim());
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t("লিংকটি কপি করুন", "Copy this link"), url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="card share-card no-print" aria-labelledby="share-h">
      <h2 id="share-h" className="h3">{t("অন্যদের জানান", "Tell others")}</h2>
      <p className="muted">{t("এই পাতাটি পরিবার, প্রতিবেশী বা গ্রুপে পাঠান — যত বেশি মানুষ জানবে, তত বেশি প্রশ্ন উঠবে।", "Send this page to family, neighbours or a group — the more people know, the more questions get asked.")}</p>
      <div className="share">
        <a className="btn btn-wa" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden />{t("হোয়াটসঅ্যাপ", "WhatsApp")}</a>
        <a className="btn btn-fb" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener"><FacebookIcon />{t("ফেসবুক", "Facebook")}</a>
        <a className="btn btn-ms" href={`fb-messenger://share/?link=${u}`}><MessageCircle size={18} aria-hidden />{t("মেসেঞ্জার", "Messenger")}</a>
        <button type="button" className="btn" onClick={copy} aria-live="polite">
          {copied ? <Check size={18} aria-hidden /> : <Link2 size={18} aria-hidden />}
          {copied ? t("কপি হয়েছে", "Copied") : t("লিংক কপি", "Copy link")}
        </button>
        {canShare ? (
          <button type="button" className="btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>
            <Share2 size={18} aria-hidden />{t("আরও (ইনস্টাগ্রাম, ইমো…)", "More (Instagram, imo…)")}
          </button>
        ) : null}
        {poster ? (
          <Link className="btn" to={poster}><Printer size={18} aria-hidden />{t("নোটিশ বোর্ডের পোস্টার", "Notice-board poster")}</Link>
        ) : (
          <button type="button" className="btn" onClick={() => window.print()}><Printer size={18} aria-hidden />{t("প্রিন্ট করুন", "Print")}</button>
        )}
      </div>
    </section>
  );
}
