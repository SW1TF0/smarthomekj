import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { LEGAL_KEYS } from "@/i18n/legal";
import { buildCatalogue } from "@/lib/catalogue";
import { categoriesWithPages, categoryPath } from "@/lib/product-seo";
import { absoluteUrl, languageAlternates, localePath } from "@/lib/seo";

export const dynamic = "force-static";

type Entry = { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" };

const fixedPages: Entry[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "solutions", priority: 0.9, changeFrequency: "monthly" },
  { path: "calculator", priority: 0.9, changeFrequency: "monthly" },
  { path: "demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "shop", priority: 0.9, changeFrequency: "weekly" },
  { path: "black-friday", priority: 0.8, changeFrequency: "weekly" },
  { path: "faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "about", priority: 0.5, changeFrequency: "yearly" },
  { path: "contact", priority: 0.7, changeFrequency: "yearly" },
  ...LEGAL_KEYS.map((doc) => ({ path: `legal/${doc}`, priority: 0.2, changeFrequency: "yearly" as const })),
];

/** Every public page in every language, with links between the language versions. Bulgarian first.
 *  Products and category pages come from the catalogue at build time (lib/catalogue.ts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const pages: Entry[] = [
    ...fixedPages.slice(0, 5),
    ...(await categoriesWithPages()).map((c) => ({ path: categoryPath(c), priority: 0.8, changeFrequency: "weekly" as const })),
    ...(await buildCatalogue()).map((p) => ({ path: `shop/${p.slug}`, priority: 0.7, changeFrequency: "weekly" as const })),
    ...fixedPages.slice(5),
  ];
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
