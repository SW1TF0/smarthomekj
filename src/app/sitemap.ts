import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { LEGAL_KEYS } from "@/i18n/legal";
import { starterProducts } from "@/lib/products";
import { absoluteUrl, languageAlternates, localePath } from "@/lib/seo";

export const dynamic = "force-static";

const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "solutions", priority: 0.9, changeFrequency: "monthly" },
  { path: "calculator", priority: 0.9, changeFrequency: "monthly" },
  { path: "demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "shop", priority: 0.9, changeFrequency: "weekly" },
  ...starterProducts.map((p) => ({ path: `shop/${p.slug}`, priority: 0.7, changeFrequency: "weekly" as const })),
  { path: "faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "about", priority: 0.5, changeFrequency: "yearly" },
  { path: "contact", priority: 0.7, changeFrequency: "yearly" },
  ...LEGAL_KEYS.map((doc) => ({ path: `legal/${doc}`, priority: 0.2, changeFrequency: "yearly" as const })),
];

/** Every public page in every language, with links between the language versions. Bulgarian first. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.flatMap(({ path, priority, changeFrequency }) => {
    const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, absoluteUrl(href)]));
    return locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      lastModified,
      changeFrequency,
      priority: locale === "bg" ? priority : Math.round(priority * 0.8 * 10) / 10,
      alternates: { languages },
    }));
  });
}
