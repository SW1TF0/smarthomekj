"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { db } from "./db";
import { notifyTeam } from "./mail";
import { vatFromGross } from "./money";
import { localizeProduct } from "./products";
import { clientIp, rateLimit } from "./rate-limit";
import { getSettings } from "./settings";
import { shippingFor } from "./shipping";
import { newOrderNumber, sendOrderConfirmation } from "./orders";
import { getStripe } from "./stripe";

const orderSchema = z.object({
  locale: z.string(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  postcode: z.string().trim().min(3).max(12),
  country: z.literal("BG"),
  companyName: z.string().trim().max(200).optional(),
  vatNumber: z.string().trim().max(40).optional(),
  note: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["CARD", "COD", "BANK"]),
  terms: z.literal(true),
});

export type OrderInput = z.input<typeof orderSchema>;
export type OrderResult =
  | { ok: true; redirect: string }
  | { ok: false; error: "invalid" | "terms" | "stock" | "payment" | "empty" | "rate"; fields?: string[] };

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  if (!rateLimit(`order:${clientIp(await headers())}`, 10, 10 * 60_000)) return { ok: false, error: "rate" };
  if (!input.terms) return { ok: false, error: "terms" };
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const data = parsed.data;
  const locale: Locale = isLocale(data.locale) ? data.locale : "bg";
  const settings = await getSettings();

  const stripe = getStripe();
  if (data.paymentMethod === "CARD" && !stripe) return { ok: false, error: "payment" };
  if (data.paymentMethod === "COD" && !settings.codEnabled) return { ok: false, error: "payment" };
  if (data.paymentMethod === "BANK" && !settings.bankTransferEnabled) return { ok: false, error: "payment" };

  // Prices always come from the database, never from the browser.
  const ids = [...new Set(data.items.map((i) => i.productId))];
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true } });
  const lines = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { product, quantity: item.quantity } : null;
  });
  if (lines.some((l) => !l) || !lines.length) return { ok: false, error: "stock" };
  const valid = lines as { product: (typeof products)[number]; quantity: number }[];

  const subtotalCents = valid.reduce((n, l) => n + l.product.priceCents * l.quantity, 0);
  const shippingCents = shippingFor(subtotalCents, settings);
  const totalCents = subtotalCents + shippingCents;

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const l of valid) {
        const updated = await tx.product.updateMany({
          where: { id: l.product.id, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (updated.count === 0) throw new Error("stock");
      }
      return tx.order.create({
        data: {
          number: newOrderNumber(),
          locale,
          paymentMethod: data.paymentMethod,
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postcode: data.postcode,
          country: data.country,
          companyName: data.companyName || null,
          vatNumber: data.vatNumber || null,
          note: data.note || null,
          subtotalCents,
          shippingCents,
          totalCents,
          vatCents: vatFromGross(totalCents),
          termsAcceptedAt: new Date(),
          items: {
            create: valid.map((l) => ({
              productId: l.product.id,
              name: localizeProduct(l.product, locale).name,
              sku: l.product.sku,
              priceCents: l.product.priceCents,
              quantity: l.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "stock") return { ok: false, error: "stock" };
    throw error;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const successPath = `/${locale}/checkout/success?order=${order.number}`;
  const successUrl = `${site}${successPath}`;

  if (data.paymentMethod === "CARD" && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      locale,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      line_items: [
        ...order.items.map((i) => ({
          quantity: i.quantity,
          price_data: { currency: "eur", unit_amount: i.priceCents, product_data: { name: i.name } },
        })),
        ...(shippingCents > 0
          ? [{ quantity: 1, price_data: { currency: "eur", unit_amount: shippingCents, product_data: { name: "Delivery" } } }]
          : []),
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successUrl}&cancelled=1`,
    });
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    return { ok: true, redirect: session.url! };
  }

  await sendOrderConfirmation(order);
  await notifyTeam(`New order ${order.number}`, `${order.name}, ${order.paymentMethod}, ${(order.totalCents / 100).toFixed(2)} EUR\n${site}/admin/orders/${order.id}`);
  return { ok: true, redirect: successPath };
}
