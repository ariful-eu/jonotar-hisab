const SITE = "কাতুলীর বাজেট — স্বাধীন নাগরিক উদ্যোগ";

export function pageMeta(title: string, description: string) {
  return [
    { title: `${title} | ${SITE}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE },
    { property: "og:locale", content: "bn_BD" },
  ];
}
