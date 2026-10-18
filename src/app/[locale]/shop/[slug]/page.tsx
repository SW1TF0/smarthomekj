import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { localizeProduct, starterProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

// Starter products get their own pre-rendered pages; products added later in the admin use /shop/product/?p=slug.
export function generateStaticParams() {
  return locales.flatMap((locale) => starterProducts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = starterProducts.find((s) => s.slug === slug);
  if (!isLocale(locale) || !p) return {};
  const product = localizeProduct(p, locale);
  return pageMetadata({ locale, path: `shop/${slug}`, title: product.name, description: getDictionary(locale).meta.product.replace("{tagline}", product.tagline) });
}

export default async function ProductPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <ProductDetail slug={slug} locale={locale} dict={getDictionary(locale)} />;
}
