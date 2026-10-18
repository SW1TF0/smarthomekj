import "server-only";
import { db } from "./db";
import { notifyTeam } from "./mail";
import { restock, sendOrderConfirmation } from "./orders";

/** Mark an order paid once (safe to call from both the webhook and the success page). */
export async function markOrderPaid(orderId: string) {
  const result = await db.order.updateMany({
    where: { id: orderId, paymentStatus: "UNPAID" },
    data: { paymentStatus: "PAID", status: "PAID" },
  });
  if (result.count === 0) return;
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  await sendOrderConfirmation(order);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await notifyTeam(`New paid order ${order.number}`, `${order.name}, ${(order.totalCents / 100).toFixed(2)} EUR\n${site}/admin/orders/${order.id}`);
}

export async function cancelUnpaidOrder(orderId: string) {
  const result = await db.order.updateMany({
    where: { id: orderId, paymentStatus: "UNPAID", status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (result.count > 0) await restock(orderId);
}
