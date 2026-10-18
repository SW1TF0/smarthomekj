"use client";

import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { formatMoney, vatFromGross } from "@/lib/money";
import { placeOrder } from "@/lib/order-actions";
import { shippingFor, type ShippingRules } from "@/lib/shipping";
import { LinkedText } from "./action-form";
import { useCart } from "./cart-provider";
import { ProductVisual } from "./product-visual";

type Method = "CARD" | "COD" | "BANK";

type Labels = {
  checkout: {
    contact: string;
    delivery: string;
    payment: string;
    summary: string;
    fields: Record<"name" | "email" | "phone" | "address" | "city" | "postcode" | "country" | "companyName" | "vatNumber" | "note", string>;
    methods: Record<Method, { title: string; text: string }>;
    terms: string;
    termsLink: string;
    returnsLink: string;
    privacy: string;
    privacyLink: string;
    preContract: string;
    submit: string;
    processing: string;
    errors: Record<"empty" | "terms" | "stock" | "payment" | "invalid", string>;
  };
  cart: { subtotal: string; shipping: string; free: string; total: string; vatIncluded: string; empty: string; continue: string };
  error: string;
};

export function CheckoutForm({
  locale,
  labels,
  rules,
  methods,
  seller,
}: {
  locale: Locale;
  labels: Labels;
  rules: ShippingRules;
  methods: Method[];
  seller: { legalName: string; address: string };
}) {
  const { items, subtotalCents, clear, ready } = useCart();
  const [method, setMethod] = useState<Method>(methods[0] ?? "COD");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const c = labels.checkout;
  const shipping = shippingFor(subtotalCents, rules);
  const total = subtotalCents + shipping;
  const money = (v: number) => formatMoney(v, locale);

  if (ready && items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="lead text-mute">{labels.cart.empty}</p>
        <a href={`/${locale}/shop`} className="btn btn-primary mt-8">
          {labels.cart.continue}
        </a>
      </div>
    );
  }

  function submit(form: HTMLFormElement) {
    setError(null);
    if (!terms) {
      setError(c.errors.terms);
      return;
    }
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "");
    start(async () => {
      try {
        const result = await placeOrder({
          locale,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          address: get("address"),
          city: get("city"),
          postcode: get("postcode"),
          country: "BG",
          companyName: get("companyName") || undefined,
          vatNumber: get("vatNumber") || undefined,
          note: get("note") || undefined,
          paymentMethod: method,
          terms: true,
        });
        if (result.ok) {
          clear();
          window.location.href = result.redirect;
          return;
        }
        setInvalid(result.fields ?? []);
        setError(result.error === "rate" ? labels.error : c.errors[result.error]);
      } catch {
        setError(labels.error);
      }
    });
  }

  const input = (name: keyof Labels["checkout"]["fields"], opts: { type?: string; required?: boolean; autoComplete?: string; span?: boolean } = {}) => (
    <div className={opts.span ? "sm:col-span-2" : ""}>
      <label htmlFor={`co-${name}`} className="label">
        {c.fields[name]}
        {opts.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={`co-${name}`}
        name={name}
        type={opts.type ?? "text"}
        required={opts.required}
        autoComplete={opts.autoComplete}
        aria-invalid={invalid.includes(name) || undefined}
        className="field"
      />
    </div>
  );

  return (
    <form
      className="grid gap-12 lg:grid-cols-[1fr_400px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
    >
      <div className="space-y-12">
        <fieldset>
          <legend className="headline-md mb-6">{c.contact}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {input("name", { required: true, autoComplete: "name", span: true })}
            {input("email", { type: "email", required: true, autoComplete: "email" })}
            {input("phone", { type: "tel", required: true, autoComplete: "tel" })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="headline-md mb-6">{c.delivery}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {input("address", { required: true, autoComplete: "street-address", span: true })}
            {input("city", { required: true, autoComplete: "address-level2" })}
            {input("postcode", { required: true, autoComplete: "postal-code" })}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-country">
                {c.fields.country}
              </label>
              <input id="co-country" className="field bg-cloud" value="България / Bulgaria" readOnly />
            </div>
            {input("companyName", { autoComplete: "organization" })}
            {input("vatNumber")}
            <div className="sm:col-span-2">
              <label htmlFor="co-note" className="label">
                {c.fields.note}
              </label>
              <textarea id="co-note" name="note" rows={3} className="field" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="headline-md mb-6">{c.payment}</legend>
          <div className="space-y-3">
            {methods.map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer items-start gap-4 rounded-[18px] border p-5 transition-colors ${
                  method === m ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line hover:border-faint"
                }`}
              >
                <input type="radio" name="payment" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-accent" />
                <span>
                  <span className="block text-[17px] font-semibold">{c.methods[m].title}</span>
                  <span className="block text-[14px] text-mute">{c.methods[m].text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-[24px] bg-cloud p-8 lg:sticky lg:top-20">
        <h2 className="text-[21px] font-semibold tracking-tight">{c.summary}</h2>
        <ul className="mt-5 space-y-4">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3">
              <ProductVisual category={i.category} imageUrl={i.imageUrl} alt={i.name} size="sm" className="h-14 w-14 shrink-0 rounded-xl" />
              <span className="flex-1 text-[14px]">
                {i.name} <span className="text-mute">× {i.quantity}</span>
              </span>
              <span className="text-[14px] font-medium">{money(i.priceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-line pt-5 text-[15px]">
          <div className="flex justify-between">
            <dt>{labels.cart.subtotal}</dt>
            <dd>{money(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{labels.cart.shipping}</dt>
            <dd>{shipping === 0 ? labels.cart.free : money(shipping)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-[21px] font-semibold">
            <dt>{labels.cart.total}</dt>
            <dd>{money(total)}</dd>
          </div>
          <p className="text-right text-[12px] text-mute">{labels.cart.vatIncluded.replace("{amount}", money(vatFromGross(total)))}</p>
        </dl>

        <p className="mt-6 rounded-2xl bg-white p-4 text-[12px] leading-relaxed text-mute">
          {c.preContract.replace("{legalName}", seller.legalName).replace("{address}", seller.address)}
        </p>

        <label className="mt-5 flex items-start gap-3 text-[13px] text-ink-2">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required className="mt-0.5 h-4 w-4 accent-accent" />
          <span>
            <LinkedText
              template={c.terms}
              links={{
                terms: { href: `/${locale}/legal/terms`, label: c.termsLink },
                returns: { href: `/${locale}/legal/returns`, label: c.returnsLink },
              }}
            />
          </span>
        </label>
        <p className="mt-3 text-[12px] text-mute">
          <LinkedText template={c.privacy} links={{ privacy: { href: `/${locale}/legal/privacy`, label: c.privacyLink } }} />
        </p>

        {error && (
          <p className="mt-4 text-[14px] text-danger" role="alert">
            {error}
          </p>
        )}

        {/* Button wording required by Directive 2011/83/EU art. 8(2). */}
        <button type="submit" className="btn btn-primary mt-6 w-full !py-4" disabled={pending || !ready}>
          {pending ? c.processing : c.submit}
        </button>
      </aside>
    </form>
  );
}
