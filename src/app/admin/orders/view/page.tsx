"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminForm, str } from "@/components/admin/admin-form";
import { Badge, Card, Empty, Loading, PageHeader, inputCls, labelCls, statusLabel } from "@/components/admin/ui";
import { ORDER_STATUSES, findWithdrawalsForOrder, getOrder, listAllProducts, saveOrder, toDate, useAdminData } from "@/lib/admin-store";
import { formatDate, formatMoney } from "@/lib/money";

const mailText: Record<string, string> = {
  PROCESSING: "Потвърждаваме поръчката Ви. Ще Ви уведомим, когато я изпратим.",
  SHIPPED: "Поръчката Ви е изпратена.",
  DELIVERED: "Поръчката Ви е доставена. Благодарим Ви!",
  CANCELLED: "Поръчката Ви е отказана.",
  REFUNDED: "Възстановихме сумата по поръчката Ви.",
};

export default function OrderPage() {
  const id = useSearchParams().get("id") ?? "";
  const { data, error, reload } = useAdminData(
    async () => {
      const order = await getOrder(id);
      if (!order) return { order: null, withdrawals: 0, products: [] };
      const [withdrawals, products] = await Promise.all([findWithdrawalsForOrder(order.number), listAllProducts()]);
      return { order, withdrawals, products };
    },
    [id],
  );
  if (!data) return <Loading error={error} />;
  const { order, withdrawals, products } = data;
  if (!order) return <Empty text="Поръчката не е намерена." />;

  // Prices are written by the visitor's browser; compare with the catalogue so tampering is visible.
  const priceOf = Object.fromEntries(products.map((p) => [p.slug, p.priceCents]));
  const mismatched = order.items.filter((i) => priceOf[i.slug] !== undefined && priceOf[i.slug] !== i.priceCents);
  const itemsTotal = order.items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const sumWrong = itemsTotal !== order.subtotalCents || order.subtotalCents + order.shippingCents !== order.totalCents;

  const mailto = (status: string) => {
    const body = `Здравейте, ${order.name},\n\n${mailText[status] ?? `Статусът на поръчка ${order.number} е: ${statusLabel[status] ?? status}.`}${
      order.trackingNumber ? `\nНомер на пратката: ${order.trackingNumber}` : ""
    }\n\nПоръчка: ${order.number}\nСума: ${formatMoney(order.totalCents)}\n\nSmartHomeKJ`;
    return `mailto:${order.email}?subject=${encodeURIComponent(`SmartHomeKJ: поръчка ${order.number}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <PageHeader
        title={`Поръчка ${order.number}`}
        subtitle={`${formatDate(toDate(order.createdAt))} · ${statusLabel[order.paymentMethod]} · език ${order.locale.toUpperCase()}`}
        action={
          <Link href="/admin/orders/" className="text-[14px] text-link">
            ← Всички поръчки
          </Link>
        }
      />
      {(mismatched.length > 0 || sumWrong) && (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 text-[14px] text-red-800" role="alert">
          Внимание: цените в поръчката не съвпадат с каталога{mismatched.length ? ` (${mismatched.map((i) => i.sku).join(", ")})` : ""}. Проверете сумата с клиента преди да потвърдите.
        </p>
      )}
      {withdrawals > 0 && (
        <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-[14px] text-amber-800">
          Клиентът е заявил отказ от договора ({withdrawals}). Вижте{" "}
          <Link href="/admin/requests/" className="underline">
            GDPR и откази
          </Link>
          .
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h2 className="mb-4 font-semibold">Продукти</h2>
            <ul className="divide-y divide-line text-[14px]">
              {order.items.map((i) => (
                <li key={i.slug} className="flex justify-between py-2">
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
                <dd>{formatDate(toDate(order.termsAcceptedAt))}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Статус</h2>
            <Badge value={order.status} />
          </div>
          <AdminForm
            onSubmit={async (f) => {
              await saveOrder(order, {
                status: str(f, "status"),
                paymentStatus: str(f, "paymentStatus"),
                trackingNumber: str(f, "trackingNumber"),
                adminNotes: str(f, "adminNotes"),
              });
              reload();
            }}
          >
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
          </AdminForm>
          <a href={mailto(order.status)} className="btn btn-sm mt-4 w-full bg-cloud">
            Пиши на клиента
          </a>
          <p className="mt-4 text-[12px] text-mute">
            „Потвърдена“ намалява наличността, „Отказана“ или „Възстановена“ я връща. „Пиши на клиента“ отваря готов имейл със статуса.
          </p>
        </Card>
      </div>
    </>
  );
}
