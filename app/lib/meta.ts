const SITE = "জনতার হিসাব — কাতুলী ইউনিয়ন";

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
