import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { formatMoney } from "@/lib/money";
import { CATEGORIES, getProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.shop.title, description: dict.shop.subtitle };
}

export const dynamic = "force-dynamic";

export default async function ShopPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ category?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { category } = await searchParams;
  const active = CATEGORIES.find((c) => c === category);
  const [products, settings] = await Promise.all([getProducts(locale, { category: active }), getSettings()]);

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
    <section className="pt-16 pb-28 md:pt-24">
      <div className="container-wide">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="headline-xl">{dict.shop.title}</h1>
            <p className="lead mt-3 text-mute">{dict.shop.subtitle}</p>
          </div>
          <p className="text-[14px] text-mute md:text-right">
            {dict.shop.delivery.replace("{amount}", formatMoney(settings.freeShippingFromCents, locale))}
            <br />
            {dict.shop.withdrawal}
          </p>
        </div>

        <nav className="no-scrollbar -mx-[22px] mt-10 flex gap-2 overflow-x-auto px-[22px]" aria-label={dict.shop.title}>
          {pill(`/${locale}/shop`, dict.shop.all, !active)}
          {CATEGORIES.map((c) => pill(`/${locale}/shop?category=${c}`, dict.shop.categories[c], active === c))}
        </nav>

        {products.length === 0 ? (
          <p className="py-24 text-center text-mute">{dict.shop.empty}</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
