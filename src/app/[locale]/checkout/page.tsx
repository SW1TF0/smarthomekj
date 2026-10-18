import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { getSettings } from "@/lib/settings";
import { cardPaymentsEnabled } from "@/lib/stripe";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.checkout.title, robots: { index: false } };
}

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const s = await getSettings();
  const methods = [
    ...(cardPaymentsEnabled() ? (["CARD"] as const) : []),
    ...(s.codEnabled ? (["COD"] as const) : []),
    ...(s.bankTransferEnabled ? (["BANK"] as const) : []),
  ];

  return (
    <section className="pt-16 pb-28 md:pt-24">
      <div className="container-apple">
        <h1 className="headline-lg mb-12">{dict.checkout.title}</h1>
        <CheckoutForm
          locale={locale}
          labels={{ checkout: dict.checkout, cart: dict.cart, error: dict.common.error }}
          rules={{ shippingCents: s.shippingCents, freeShippingFromCents: s.freeShippingFromCents }}
          methods={methods}
          seller={{ legalName: s.legalName, address: `${s.address}, ${s.city}` }}
        />
      </div>
    </section>
  );
}
