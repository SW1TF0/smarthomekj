import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, inputCls, labelCls, statusLabel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/orders";
import { updateOrder } from "../../actions";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const withdrawals = await db.withdrawalRequest.findMany({ where: { orderNumber: order.number } });

  return (
    <>
      <PageHeader
        title={`Поръчка ${order.number}`}
        subtitle={`${formatDate(order.createdAt)} · ${statusLabel[order.paymentMethod]} · език ${order.locale.toUpperCase()}`}
        action={
          <Link href="/admin/orders" className="text-[14px] text-link">
            ← Всички поръчки
          </Link>
        }
      />
      {withdrawals.length > 0 && (
        <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-[14px] text-amber-800">
          Клиентът е заявил отказ от договора ({withdrawals.length}). Вижте <Link href="/admin/requests" className="underline">GDPR и откази</Link>.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h2 className="mb-4 font-semibold">Продукти</h2>
            <ul className="divide-y divide-line text-[14px]">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>
                    {i.name} <span className="text-mute">({i.sku}) × {i.quantity}</span>
                  </span>
                  <span>{formatMoney(i.priceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-mute">Междинна сума</dt>
                <dd>{formatMoney(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mute">Доставка</dt>
                <dd>{formatMoney(order.shippingCents)}</dd>
              </div>
              <div className="flex justify-between text-[17px] font-semibold">
                <dt>Общо</dt>
                <dd>{formatMoney(order.totalCents)}</dd>
              </div>
              <div className="flex justify-between text-mute">
                <dt>в т.ч. ДДС 20%</dt>
                <dd>{formatMoney(order.vatCents)}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Клиент и доставка</h2>
            <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-mute">Име</dt>
                <dd>{order.name}</dd>
              </div>
              <div>
                <dt className="text-mute">Контакт</dt>
                <dd>
                  <a href={`mailto:${order.email}`} className="text-link">
                    {order.email}
                  </a>
                  <br />
                  <a href={`tel:${order.phone}`} className="text-link">
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-mute">Адрес</dt>
                <dd>
                  {order.address}
                  <br />
                  {order.postcode} {order.city}, {order.country}
                </dd>
              </div>
              {(order.companyName || order.vatNumber) && (
                <div>
                  <dt className="text-mute">Фактура</dt>
                  <dd>
                    {order.companyName}
                    <br />
                    {order.vatNumber}
                  </dd>
                </div>
              )}
              {order.note && (
                <div className="sm:col-span-2">
                  <dt className="text-mute">Бележка от клиента</dt>
                  <dd className="whitespace-pre-wrap">{order.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-mute">Приети общи условия</dt>
                <dd>{formatDate(order.termsAcceptedAt)}</dd>
              </div>
              {order.stripeSessionId && (
                <div>
                  <dt className="text-mute">Stripe</dt>
                  <dd className="break-all text-[12px]">{order.stripeSessionId}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Статус</h2>
            <Badge value={order.status} />
          </div>
          <form action={updateOrder.bind(null, order.id)} className="space-y-4">
            <div>
              <label className={labelCls}>Статус на поръчката</label>
              <select name="status" defaultValue={order.status} className={inputCls}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Плащане</label>
              <select name="paymentStatus" defaultValue={order.paymentStatus} className={inputCls}>
                {["UNPAID", "PAID", "REFUNDED"].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Номер на пратка</label>
              <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Вътрешни бележки</label>
              <textarea name="adminNotes" rows={4} defaultValue={order.adminNotes ?? ""} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" name="notify" defaultChecked /> Уведоми клиента по имейл при смяна на статуса
            </label>
            <button className="btn btn-primary btn-sm">Запази</button>
          </form>
          <p className="mt-4 text-[12px] text-mute">Отказването на поръчка връща наличността. Възстановяване на суми с карта се прави от Stripe таблото.</p>
        </Card>
      </div>
    </>
  );
}
