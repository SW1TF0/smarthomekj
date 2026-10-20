import type { Locale } from "@/i18n/config";
import { faqs as seedFaqs, products as seedProducts } from "@/data/seed";

export const CATEGORIES = ["lighting", "climate", "security", "energy", "entertainment", "cleaning", "hubs"] as const;

export type ProductText = { name: string; tagline: string; description: string; specs: string[] };
export type ProductTranslations = Partial<Record<Locale, ProductText>>;

/** A product as stored in Firestore (`products/{slug}`). Prices are gross euro cents, VAT included. */
export type ProductDoc = {
  slug: string;
  sku: string;
  category: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  imageUrl: string | null;
  translations: ProductTranslations;
  sortOrder: number;
};

export type ProductView = {
  id: string;
  slug: string;
  sku: string;
  category: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  featured: boolean;
  imageUrl: string | null;
} & ProductText;

export type FaqDoc = {
  translations: Partial<Record<Locale, { q: string; a: string }>>;
  keywords: string;
  sortOrder: number;
  active: boolean;
};

const empty: ProductText = { name: "", tagline: "", description: "", specs: [] };

export function localizeProduct(p: ProductDoc, locale: Locale): ProductView {
  const text = { ...empty, ...(p.translations.bg ?? {}), ...(p.translations[locale] ?? {}) };
  return {
    id: p.slug,
    slug: p.slug,
    sku: p.sku,
    category: p.category,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    stock: p.stock,
    featured: p.featured,
    imageUrl: p.imageUrl,
    ...text,
  };
}

/** Starter catalogue, used to pre-render pages and as a fallback before Firebase is set up. */
export const starterProducts: ProductDoc[] = seedProducts.map((p, i) => ({
  slug: p.slug,
  sku: p.sku,
  category: p.category,
  priceCents: p.priceCents,
  compareAtCents: null,
  stock: p.stock,
  active: true,
  featured: !!p.featured,
  imageUrl: null,
  translations: { bg: p.bg, en: p.en, tr: p.tr },
  sortOrder: i,
}));

export const starterFaqs: FaqDoc[] = seedFaqs.map((f, i) => ({
  keywords: f.keywords,
  sortOrder: i,
  active: true,
  translations: {
    bg: { q: f.bg[0], a: f.bg[1] },
    en: { q: f.en[0], a: f.en[1] },
    tr: { q: f.tr[0], a: f.tr[1] },
  },
}));

const starterSlugs = new Set(starterProducts.map((p) => p.slug));

export function productHref(locale: Locale, slug: string) {
  return starterSlugs.has(slug) ? `/${locale}/shop/${slug}/` : `/${locale}/shop/product/?p=${encodeURIComponent(slug)}`;
}
