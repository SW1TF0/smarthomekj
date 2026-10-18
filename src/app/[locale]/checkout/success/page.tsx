import type { Metadata } from "next";
import { OrderPlaced } from "@/components/order-placed";
import { resolveLocale, type LocaleParams } from "@/i18n/page";

export const metadata: Metadata = { robots: { index: false } };

export default async function SuccessPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  return <OrderPlaced locale={locale} labels={{ checkout: dict.checkout, cart: dict.cart, contact: dict.nav.contact }} />;
}
