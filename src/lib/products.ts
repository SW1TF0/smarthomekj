import type { Product } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { parseJson } from "./json";

export const CATEGORIES = ["lighting", "climate", "security", "energy", "entertainment", "hubs"] as const;

export type ProductText = { name: string; tagline: string; description: string; specs: string[] };
export type ProductTranslations = Partial<Record<Locale, ProductText>>;

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

const empty: ProductText = { name: "", tagline: "", description: "", specs: [] };

export function localizeProduct(p: Product, locale: Locale): ProductView {
  const t = parseJson<ProductTranslations>(p.translations, {});
  const text = { ...empty, ...(t.bg ?? {}), ...(t[locale] ?? {}) };
  return {
    id: p.id,
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

export async function getProducts(locale: Locale, opts: { category?: string; featured?: boolean } = {}) {
  try {
    const rows = await db.product.findMany({
      where: { active: true, ...(opts.category ? { category: opts.category } : {}), ...(opts.featured ? { featured: true } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((p) => localizeProduct(p, locale));
  } catch {
    return [];
  }
}

export async function getProduct(slug: string, locale: Locale) {
  const p = await db.product.findFirst({ where: { slug, active: true } });
  return p ? localizeProduct(p, locale) : null;
}
