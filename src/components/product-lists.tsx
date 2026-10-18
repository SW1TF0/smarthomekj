"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { CATEGORIES } from "@/lib/products";
import { useProducts, useSettings } from "@/lib/store";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

type Props = { locale: Locale; dict: Dictionary };

export function FeaturedProducts({ locale, dict }: Props) {
  const { products } = useProducts(locale, { featured: true });
  return (
    <div className="mt-14 grid gap-4 md:grid-cols-3">
      {products.slice(0, 3).map((p, i) => (
        <Reveal key={p.id} delay={i * 80}>
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

function ShopCatalogue({ locale, dict }: Props) {
  const category = useSearchParams().get("category");
  const active = CATEGORIES.find((c) => c === category);
  const { products, loading } = useProducts(locale, { category: active });

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
        {CATEGORIES.map((c) => pill(`/${locale}/shop/?category=${c}`, dict.shop.categories[c], active === c))}
      </nav>
      {products.length === 0 && !loading ? (
        <p className="py-24 text-center text-mute">{dict.shop.empty}</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </>
  );
}

export function ShopGrid(props: Props) {
  return (
    <Suspense>
      <ShopCatalogue {...props} />
    </Suspense>
  );
}
