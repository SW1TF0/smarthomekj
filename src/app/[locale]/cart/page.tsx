import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.cart.title, robots: { index: false } };
}

export default async function CartPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const settings = await getSettings();
  return (
    <section className="pt-16 pb-28 md:pt-24">
      <div className="container-apple">
        <h1 className="headline-lg mb-10">{dict.cart.title}</h1>
        <CartView
          locale={locale}
          labels={dict.cart}
          rules={{ shippingCents: settings.shippingCents, freeShippingFromCents: settings.freeShippingFromCents }}
        />
      </div>
    </section>
  );
}
