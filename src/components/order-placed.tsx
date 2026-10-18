"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { formatMoney } from "@/lib/money";
import { useSettings, type OrderInput } from "@/lib/store";
import { LAST_ORDER_KEY } from "./checkout-form";
import { CheckIcon } from "./icons";

type Placed = OrderInput & { placedAt: string };

/** Confirmation after checkout, read from this browser tab, with a printable summary of the contract. */
export function OrderPlaced({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { checkout: Dictionary["checkout"]; cart: Dictionary["cart"]; contact: string };
}) {
  const s = useSettings();
  const [order, setOrder] = useState<Placed | null | undefined>(undefined);
  const c = labels.checkout;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      setOrder(raw ? (JSON.parse(raw) as Placed) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) return <section className="min-h-[60vh]" />;
  if (order === null) {
    return (
      <section className="pt-24 pb-28 text-center">
        <Link href={`/${locale}/shop`} className="btn btn-primary">
          {labels.cart.continue}
        </Link>
      </section>
    );
  }

  const money = (v: number) => formatMoney(v, locale);
  const paymentLine =
    order.paymentMethod === "COD"
      ? c.successCod
      : c.successBank.replace("{amount}", money(order.totalCents)).replace("{iban}", s.bankIban).replace("{bank}", s.bankName).replace("{number}", order.number);

  return (
    <section className="relative overflow-hidden pt-24 pb-28 text-center">
      <div className="container-apple relative max-w-[720px]">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-xl print:hidden">
          <CheckIcon size={40} />
        </span>
        <h1 className="headline-lg mt-8">{c.successTitle}</h1>
        <p className="lead mt-4 text-mute">{c.successText.replace("{number}", order.number).replace("{email}", order.email)}</p>
        <p className="mt-6 rounded-2xl bg-cloud p-5 text-[17px]">{paymentLine}</p>

        <div className="mt-8 rounded-[24px] bg-cloud p-6 text-left text-[15px]">
          <p className="font-semibold">
            {order.number} · {new Date(order.placedAt).toLocaleString(locale, { timeZone: "Europe/Sofia" })}
          </p>
          <ul className="mt-4 space-y-1">
            {order.items.map((i) => (
              <li key={i.slug} className="flex justify-between gap-4">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{money(i.priceCents * i.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 text-mute">
              <span>{labels.cart.shipping}</span>
              <span>{order.shippingCents === 0 ? labels.cart.free : money(order.shippingCents)}</span>
            </li>
            <li className="flex justify-between gap-4 pt-2 font-semibold">
              <span>{labels.cart.total}</span>
              <span>{money(order.totalCents)}</span>
            </li>
          </ul>
          <p className="mt-4 text-[13px] text-mute">
            {c.preContract.replace("{legalName}", s.legalName).replace("{address}", `${s.address}, ${s.city}`)}
          </p>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm mt-5 print:hidden">
            {c.print}
          </button>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 print:hidden">
          <Link href={`/${locale}/shop`} className="btn btn-primary">
            {labels.cart.continue}
          </Link>
        </div>
        <p className="mt-10 text-[13px] print:hidden">
          <Link href={`/${locale}/withdraw/?order=${order.number}`} className="text-link hover:underline">
            {c.withdrawLink}
          </Link>
        </p>
      </div>
    </section>
  );
}
