import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { buildCatalogue } from "@/lib/catalogue";
import { productJsonLd, ldJson } from "@/lib/product-seo";
import { localizeProduct } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

// Every active product has its own pre-rendered page (the catalogue as it is at build time, lib/catalogue.ts);
// a product added in the admin after the last build is reachable at /shop/product/?p=slug until the next one.
export async function generateStaticParams() {
  const products = await buildCatalogue();
  return locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = (await buildCatalogue()).find((s) => s.slug === slug);
  if (!isLocale(locale) || !p) return {};
  const product = localizeProduct(p, locale);
  return pageMetadata({ locale, path: `shop/${slug}`, title: product.name, description: getDictionary(locale).meta.product.replace("{tagline}", product.tagline) });
}

export default async function ProductPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const doc = (await buildCatalogue()).find((s) => s.slug === slug);
  if (!doc) notFound();
  const dict = getDictionary(locale);
  return (
    <>
      {productJsonLd(doc, locale, dict).map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}
      <ProductDetail slug={slug} initial={doc} locale={locale} dict={dict} />
    </>
  );
}
