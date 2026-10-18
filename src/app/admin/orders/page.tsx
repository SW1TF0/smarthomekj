"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Empty, Filters, Loading, PageHeader, Table, Td, statusLabel } from "@/components/admin/ui";
import { ORDER_STATUSES, listOrders, toDate, useAdminData } from "@/lib/admin-store";
import { formatDate, formatMoney } from "@/lib/money";

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, error } = useAdminData(listOrders);
  if (!data) return <Loading error={error} />;
  const needle = q.trim().toLowerCase();
  const orders = data.filter(
    (o) => (!status || o.status === status) && (!needle || [o.number, o.email, o.name, o.phone].some((v) => v?.toLowerCase().includes(needle))),
  );

  return (
    <>
      <PageHeader title="Поръчки" subtitle="Потвърдете всяка нова поръчка с клиента, после я изпратете." />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Търсене по номер, име, имейл, телефон…"
        aria-label="Търсене"
        className="mb-4 w-full max-w-md rounded-full border border-line bg-white px-4 py-2 text-[14px]"
      />
      <Filters current={status} onChange={setStatus} options={Object.fromEntries(ORDER_STATUSES.map((s) => [s, statusLabel[s]]))} />
      {orders.length === 0 ? (
        <Empty text="Няма поръчки." />
      ) : (
        <Table head={["Номер", "Дата", "Клиент", "Плащане", "Статус", "Сума"]}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-cloud/50">
              <Td>
                <Link href={`/admin/orders/view/?id=${o.id}`} className="font-medium text-link">
                  {o.number}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-mute">{formatDate(toDate(o.createdAt))}</Td>
              <Td>
                {o.name}
                <span className="block text-[12px] text-mute">{o.email}</span>
              </Td>
              <Td>
                {statusLabel[o.paymentMethod]}
                <span className="block">
                  <Badge value={o.paymentStatus} />
                </span>
              </Td>
              <Td>
                <Badge value={o.status} />
              </Td>
              <Td className="whitespace-nowrap font-medium">{formatMoney(o.totalCents)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
