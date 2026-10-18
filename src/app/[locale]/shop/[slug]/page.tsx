import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart";
import { CheckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { formatMoney } from "@/lib/money";
import { getProduct, getProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug, locale);
  return product ? { title: product.name, description: product.tagline } : {};
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const product = await getProduct(slug, locale);
  if (!product) notFound();
  const [settings, sameCategory] = await Promise.all([getSettings(), getProducts(locale, { category: product.category })]);
  const related = sameCategory.filter((p) => p.id !== product.id).slice(0, 3);

  const stockText =
    product.stock <= 0
      ? dict.common.outOfStock
      : product.stock <= 5
        ? dict.common.lowStock.replace("{n}", String(product.stock))
        : dict.common.inStock;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <section className="pt-10 pb-20 md:pt-16">
        <div className="container-wide">
          <nav className="text-[14px] text-mute" aria-label="Breadcrumb">
            <Link href={`/${locale}/shop`} className="hover:text-ink">
              {dict.shop.title}
            </Link>{" "}
            /{" "}
            <Link href={`/${locale}/shop?category=${product.category}`} className="hover:text-ink">
              {dict.shop.categories[product.category]}
            </Link>
          </nav>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <ProductVisual
              category={product.category}
              imageUrl={product.imageUrl}
              alt={product.name}
              size="lg"
              className="tile aspect-square lg:sticky lg:top-20"
            />
            <div className="lg:py-8">
              <p className="text-[14px] font-semibold uppercase tracking-wider text-[#bf4800]">{dict.shop.categories[product.category]}</p>
              <h1 className="headline-lg mt-2">{product.name}</h1>
              <p className="lead mt-4 text-mute">{product.tagline}</p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-[32px] font-semibold tracking-tight">{formatMoney(product.priceCents, locale)}</span>
                {product.compareAtCents && product.compareAtCents > product.priceCents && (
                  <span className="text-[19px] text-faint line-through">{formatMoney(product.compareAtCents, locale)}</span>
                )}
              </div>
              <p className="text-[13px] text-mute">{dict.common.inclVat}</p>
              <p className={`mt-3 text-[14px] font-medium ${product.stock > 0 ? "text-success" : "text-danger"}`}>{stockText}</p>

              <AddToCartButton
                className="btn btn-primary mt-8 w-full !py-4"
                disabled={product.stock <= 0}
                label={product.stock > 0 ? dict.common.addToCart : dict.common.outOfStock}
                addedLabel={dict.common.added}
                item={{
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  category: product.category,
                  imageUrl: product.imageUrl,
                  priceCents: product.priceCents,
                }}
              />

              <ul className="mt-8 space-y-2 rounded-[20px] bg-cloud p-6 text-[14px] text-ink-2">
                <li>{dict.shop.delivery.replace("{amount}", formatMoney(settings.freeShippingFromCents, locale))}</li>
                <li>{dict.shop.withdrawal}</li>
                <li>
                  {dict.shop.installation}{" "}
                  <Link href={`/${locale}/contact?service=${product.category}`} className="link-chevron">
                    {dict.nav.consultation}
                  </Link>
                </li>
              </ul>

              {product.description && <p className="mt-10 whitespace-pre-line text-[17px] leading-relaxed text-ink-2">{product.description}</p>}

              {product.specs.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-[21px] font-semibold tracking-tight">{dict.shop.specs}</h2>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {product.specs.map((spec) => (
                      <li key={spec} className="flex items-start gap-3 py-3 text-[15px]">
                        <CheckIcon size={18} className="mt-0.5 shrink-0 text-mute" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-cloud py-20">
          <div className="container-wide">
            <h2 className="headline-md">{dict.shop.related}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
