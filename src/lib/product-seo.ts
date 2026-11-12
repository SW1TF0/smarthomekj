import "server-only";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { blackFriday, promoPhase, withPromo } from "./black-friday";
import { CATEGORIES, localizeProduct, type ProductDoc } from "./products";
import { buildCatalogue } from "./catalogue";
import { getDictionary } from "@/i18n";
import { absoluteUrl, basePath, localePath } from "./seo";

// JSON-LD for the shop, written into the pre-rendered HTML (search engines read it without running the page).
// Prices are those at build time; during Black Friday the build carries the discount, the struck-through
// price and priceValidUntil, and the nightly rebuild (deploy workflow) switches it on and off.

/** Category pages exist for the categories with a title in the dictionary (dict.meta.pages.categories). */
export const categoryPath = (category: string) => `shop/c/${category}`;

export function hasCategoryPage(dict: Dictionary, category: string) {
  return category in dict.meta.pages.categories;
}

/** Categories with a page: a title in the dictionary and at least one active product at build time. */
export async function categoriesWithPages(): Promise<string[]> {
  const products = await buildCatalogue();
  return CATEGORIES.filter((c) => hasCategoryPage(getDictionary("bg"), c) && products.some((p) => p.category === c));
}

// The brand, when a known one is in the product's name (in any language); otherwise none rather than a guess.
const BRANDS = ["Hama", "HIKVISION", "iRobot", "Aqara", "Shelly", "Philips Hue", "TP-Link", "Tapo", "Sonos", "Apple", "Netatmo"];
export function brandOf(doc: ProductDoc): string | null {
  const names = Object.values(doc.translations ?? {}).map((t) => t?.name ?? "").join(" ").toLowerCase();
  return BRANDS.find((b) => names.includes(b.toLowerCase())) ?? null;
}

const money = (cents: number) => (cents / 100).toFixed(2);

export function productJsonLd(doc: ProductDoc, locale: Locale, dict: Dictionary, now = Date.now()) {
  const [p] = withPromo([doc], now);
  const product = localizeProduct(p, locale);
  const url = absoluteUrl(localePath(locale, `shop/${doc.slug}`));
  const onSale = !!product.compareAtCents && product.compareAtCents > product.priceCents;
  const crumbs: [string, string][] = [
    [dict.shop.title, absoluteUrl(localePath(locale, "shop"))],
    ...(hasCategoryPage(dict, product.category)
      ? [[dict.shop.categories[product.category as keyof typeof dict.shop.categories], absoluteUrl(localePath(locale, categoryPath(product.category)))] as [string, string]]
      : []),
    [product.name, url],
  ];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || product.tagline,
      sku: product.sku,
      ...(brandOf(doc) && { brand: { "@type": "Brand", name: brandOf(doc) } }),
      image: [product.imageUrl || absoluteUrl(`${basePath}/og.png`)],
      url,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EUR",
        price: money(product.priceCents),
        itemCondition: "https://schema.org/NewCondition",
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "SmartHomeKJ" },
        ...(onSale && {
          ...(promoPhase(now) === "live" && { priceValidUntil: blackFriday.end.slice(0, 10) }),
          priceSpecification: [
            { "@type": "UnitPriceSpecification", price: money(product.priceCents), priceCurrency: "EUR" },
            {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/StrikethroughPrice",
              price: money(product.compareAtCents!),
              priceCurrency: "EUR",
            },
          ],
        }),
      },
    },
    breadcrumbJsonLd(crumbs),
  ];
}

export function breadcrumbJsonLd(crumbs: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
