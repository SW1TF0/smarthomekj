import "server-only";
import type { Order, OrderItem } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { sendMail } from "./mail";
import { formatMoney } from "./money";
import { getSettings } from "./settings";

export const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export function newOrderNumber() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KJ${date}-${rand}`;
}

/** Put reserved stock back, e.g. when a card payment expires or an order is cancelled. */
export async function restock(orderId: string) {
  const items = await db.orderItem.findMany({ where: { orderId } });
  await db.$transaction(
    items.filter((i) => i.productId).map((i) => db.product.update({ where: { id: i.productId! }, data: { stock: { increment: i.quantity } } })),
  );
}

const copy: Record<Locale, { subject: string; hello: string; thanks: string; items: string; shipping: string; total: string; vat: string; withdraw: string }> = {
  bg: {
    subject: "Потвърждение на поръчка",
    hello: "Здравейте",
    thanks: "Благодарим за поръчката! Ето подробностите:",
    items: "Продукти",
    shipping: "Доставка",
    total: "Общо (с ДДС)",
    vat: "в т.ч. ДДС",
    withdraw: "Имате право да се откажете от договора в срок от 14 дни след получаване на стоката. Онлайн формуляр:",
  },
  en: {
    subject: "Order confirmation",
    hello: "Hello",
    thanks: "Thank you for your order! Here are the details:",
    items: "Products",
    shipping: "Shipping",
    total: "Total (incl. VAT)",
    vat: "of which VAT",
    withdraw: "You may withdraw from the contract within 14 days of receiving the goods. Online form:",
  },
  tr: {
    subject: "Sipariş onayı",
    hello: "Merhaba",
    thanks: "Siparişiniz için teşekkürler! Ayrıntılar:",
    items: "Ürünler",
    shipping: "Kargo",
    total: "Toplam (KDV dahil)",
    vat: "KDV",
    withdraw: "Ürünü teslim aldıktan sonra 14 gün içinde sözleşmeden cayabilirsiniz. Online form:",
  },
};

/** Order confirmation on a durable medium, including the pre-contract essentials. */
export async function sendOrderConfirmation(order: Order & { items: OrderItem[] }) {
  const locale = (["bg", "en", "tr"].includes(order.locale) ? order.locale : "bg") as Locale;
  const c = copy[locale];
  const s = await getSettings();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const m = (v: number) => formatMoney(v, locale);
  const lines = order.items.map((i) => `- ${i.name} × ${i.quantity}: ${m(i.priceCents * i.quantity)}`).join("\n");
  const bank =
    order.paymentMethod === "BANK" ? `\nIBAN: ${s.bankIban} (${s.bankName})\n${s.legalName}\nReference: ${order.number}\n` : "";

  await sendMail({
    to: order.email,
    subject: `${c.subject} ${order.number}`,
    text: `${c.hello} ${order.name},\n\n${c.thanks}\n\n${c.items}:\n${lines}\n${c.shipping}: ${m(order.shippingCents)}\n${c.total}: ${m(order.totalCents)} (${c.vat} ${m(order.vatCents)})\n${bank}\n${order.address}, ${order.postcode} ${order.city}\n\n${c.withdraw} ${site}/${locale}/withdraw?order=${order.number}\n${site}/${locale}/legal/terms\n\n${s.legalName}, ${s.address}, ${s.city}\nEIK ${s.eik} · ${s.email} · ${s.phone}`,
  });
}
