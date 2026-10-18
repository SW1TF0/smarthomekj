import type { Metadata } from "next";
import { ShopDelivery, ShopGrid } from "@/components/product-lists";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMetadata({ locale, path: "shop", ...dict.meta.pages.shop });
}

export default async function ShopPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);

  return (
    <section className="pt-16 pb-28 md:pt-24">
      <div className="container-wide">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="headline-xl">{dict.shop.title}</h1>
            <p className="lead mt-3 text-mute">{dict.shop.subtitle}</p>
          </div>
          <ShopDelivery locale={locale} dict={dict} />
        </div>
        <ShopGrid locale={locale} dict={dict} />
      </div>
    </section>
  );
}
