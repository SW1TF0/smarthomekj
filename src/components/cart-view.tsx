"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatMoney, vatFromGross } from "@/lib/money";
import { productHref } from "@/lib/products";
import { shippingFor } from "@/lib/shipping";
import { useSettings } from "@/lib/store";
import { useCart } from "./cart-provider";
import { ProductVisual } from "./product-visual";

type Labels = {
  title: string;
  empty: string;
  continue: string;
  subtotal: string;
  shipping: string;
  free: string;
  freeShippingHint: string;
  total: string;
  vatIncluded: string;
  checkout: string;
  remove: string;
  quantity: string;
};

export function CartView({ locale, labels }: { locale: Locale; labels: Labels }) {
  const settings = useSettings();
  const rules = { shippingCents: settings.shippingCents, freeShippingFromCents: settings.freeShippingFromCents };
  const { items, subtotalCents, setQuantity, remove, ready } = useCart();
  const shipping = shippingFor(subtotalCents, rules);
  const total = subtotalCents + shipping;
  const money = (c: number) => formatMoney(c, locale);

  if (!ready) return <div className="h-64" />;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="lead text-mute">{labels.empty}</p>
        <Link href={`/${locale}/shop`} className="btn btn-primary mt-8">
          {labels.continue}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-5 py-6">
            <Link href={productHref(locale, item.slug)} className="shrink-0">
              <ProductVisual category={item.category} imageUrl={item.imageUrl} alt={item.name} size="sm" className="h-24 w-24 rounded-2xl md:h-32 md:w-32" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
              <div>
                <Link href={productHref(locale, item.slug)} className="text-[19px] font-semibold tracking-tight hover:underline">
                  {item.name}
                </Link>
                <div className="mt-3 flex items-center gap-3">
                  <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                    {labels.quantity}
                  </label>
                  <select
                    id={`qty-${item.productId}`}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                    className="rounded-lg border border-line bg-white px-2 py-1 text-[15px]"
                  >
                    {Array.from({ length: Math.max(10, item.quantity) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => remove(item.productId)} className="text-[14px] text-link hover:underline">
                    {labels.remove}
                  </button>
                </div>
              </div>
              <p className="text-[19px] font-semibold">{money(item.priceCents * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-[24px] bg-cloud p-5 sm:p-8 lg:sticky lg:top-20">
        <dl className="space-y-3 text-[17px]">
          <div className="flex justify-between">
            <dt>{labels.subtotal}</dt>
            <dd>{money(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{labels.shipping}</dt>
            <dd>{shipping === 0 ? labels.free : money(shipping)}</dd>
          </div>
          {shipping > 0 && (
            <p className="text-[13px] text-mute">{labels.freeShippingHint.replace("{amount}", money(rules.freeShippingFromCents - subtotalCents))}</p>
          )}
          <div className="flex justify-between border-t border-line pt-4 text-[21px] font-semibold">
            <dt>{labels.total}</dt>
            <dd>{money(total)}</dd>
          </div>
          <p className="text-right text-[13px] text-mute">{labels.vatIncluded.replace("{amount}", money(vatFromGross(total)))}</p>
        </dl>
        <Link href={`/${locale}/checkout`} className="btn btn-primary mt-6 w-full !whitespace-normal !py-4 text-center">
          {labels.checkout}
        </Link>
      </aside>
    </div>
  );
}
