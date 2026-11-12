"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { CATEGORIES, type ProductDoc } from "@/lib/products";
import { useProducts, useSettings } from "@/lib/store";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

type Props = { locale: Locale; dict: Dictionary };

export function FeaturedProducts({ locale, dict }: Props) {
  const { products } = useProducts(locale, { featured: true });
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
      {products.slice(0, 3).map((p, i) => (
        <Reveal key={p.id} delay={i * 80} className={i === 2 ? "max-md:hidden" : ""}>
          <ProductCard product={p} locale={locale} dict={dict} />
        </Reveal>
      ))}
    </div>
  );
}

/** Every product, for the Black Friday page: the cards show the struck-through old price while the discount runs. */
export function AllProducts({ locale, dict }: Props) {
  const { products } = useProducts(locale);
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 3) * 80}>
          <ProductCard product={p} locale={locale} dict={dict} />
        </Reveal>
      ))}
    </div>
  );
}

export function ShopDelivery({ locale, dict }: Props) {
  const settings = useSettings();
  return (
    <p className="text-[14px] text-mute md:text-right">
      {dict.shop.delivery.replace("{amount}", formatMoney(settings.freeShippingFromCents, locale))}
      <br />
      {dict.shop.withdrawal}
    </p>
  );
}

type CatalogueProps = Props & { category?: string; pageCategories?: string[]; initial?: ProductDoc[] };

/** The shop grid. On a category page the category is fixed; on /shop/ it comes from ?category= (old links).
 *  The pills open the category pages where they exist. */
function CategoryFromQuery(props: CatalogueProps) {
  return <ShopCatalogue {...props} category={useSearchParams().get("category") ?? undefined} />;
}

function ShopCatalogue({ locale, dict, category, pageCategories = [], initial }: CatalogueProps) {
  const active = CATEGORIES.find((c) => c === category);
  const catHref = (c: string) => (pageCategories.includes(c) ? `/${locale}/shop/c/${c}/` : `/${locale}/shop/?category=${c}`);
  const { products, loading } = useProducts(locale, { category: active }, initial);

  const pill = (href: string, label: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? "page" : undefined}
      className={`shrink-0 rounded-full px-4 py-2 text-[14px] transition-colors ${on ? "bg-ink text-white" : "bg-cloud text-ink hover:bg-line/60"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <nav className="no-scrollbar -mx-[22px] mt-10 flex gap-2 overflow-x-auto px-[22px]" aria-label={dict.shop.title}>
        {pill(`/${locale}/shop/`, dict.shop.all, !active)}
        {CATEGORIES.map((c) => pill(catHref(c), dict.shop.categories[c], active === c))}
      </nav>
      {products.length === 0 && !loading ? (
        <p className="py-24 text-center text-mute">{dict.shop.empty}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </>
  );
}

/** On a category page the grid is fully pre-rendered; on /shop/ the pre-rendered HTML shows every product
 *  (the Suspense fallback) and the browser then applies ?category= from old links. */
export function ShopGrid(props: CatalogueProps) {
  if (props.category) return <ShopCatalogue {...props} />;
  return (
    <Suspense fallback={<ShopCatalogue {...props} />}>
      <CategoryFromQuery {...props} />
    </Suspense>
  );
}
