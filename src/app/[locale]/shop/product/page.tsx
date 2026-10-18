import type { Metadata } from "next";
import { ProductDetail } from "@/components/product-detail";
import { resolveLocale, type LocaleParams } from "@/i18n/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.shop.title };
}

/** Products added in the admin after the last deploy: /shop/product/?p=slug */
export default async function ProductByQueryPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  return <ProductDetail locale={locale} dict={dict} />;
}
