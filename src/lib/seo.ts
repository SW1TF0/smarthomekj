import "server-only";
import type { Metadata } from "next";
import { defaultLocale, htmlLang, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

/** Public address of the live site, without a trailing slash. On Vercel it comes from the project's production domain. */
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const ogLocale: Record<Locale, string> = { bg: "bg_BG", en: "en_US", tr: "tr_TR" };

/** "/demo" → "/bg/demo/"; "" → "/bg/". */
export function localePath(locale: Locale, path = "") {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `${basePath}/${locale}/${clean ? `${clean}/` : ""}`;
}

export function absoluteUrl(path: string) {
  return `${siteUrl}${path}`;
}

/** Same page in every language, for hreflang links. Bulgarian is the default for everyone else. */
export function languageAlternates(path = "") {
  return {
    ...Object.fromEntries(locales.map((l) => [htmlLang[l], localePath(l, path)])),
    "x-default": localePath(defaultLocale, path),
  };
}

type PageSeo = {
  locale: Locale;
  /** Path after the language, e.g. "demo" or "shop/shelly-1pm-gen4". */
  path?: string;
  title: string;
  description?: string;
  /** Use the title as is, without " · SmartHomeKJ". */
  absoluteTitle?: boolean;
};

/** Title, description, keywords, canonical link, hreflang links and social preview for one page. */
export function pageMetadata({ locale, path = "", title, description, absoluteTitle }: PageSeo): Metadata {
  const meta = getDictionary(locale).meta;
  const fullTitle = absoluteTitle ? title : `${title} · SmartHomeKJ`;
  const desc = description ?? meta.description;
  const image = { url: `${basePath}/og.png`, width: 1200, height: 630, alt: "SmartHomeKJ" };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    keywords: meta.keywords,
    alternates: { canonical: localePath(locale, path), languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: "SmartHomeKJ",
      title: fullTitle,
      description: desc,
      url: localePath(locale, path),
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: [image.url] },
  };
}

/** Pages that should not show up in search results (cart, checkout, forms). */
export const noIndex: Metadata["robots"] = { index: false, follow: true };
