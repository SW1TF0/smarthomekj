import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  return (
    <section className="pt-16 pb-28 md:pt-24">
      <div className="container-apple">
        <h1 className="headline-lg mb-12">{dict.checkout.title}</h1>
        <CheckoutForm locale={locale} labels={{ checkout: dict.checkout, cart: dict.cart, error: dict.common.error }} />
      </div>
    </section>
  );
}
