import Link from "next/link";
import { Badge, Empty, Filters, PageHeader, Table, Td, statusLabel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/orders";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const orders = await db.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { email: { contains: q } }, { name: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { items: true } } },
  });

  return (
    <>
      <PageHeader title="Поръчки" subtitle="Плащане, изпращане и статус на всяка поръчка." />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Търсене по номер, име, имейл, телефон…" className="w-full max-w-md rounded-full border border-line bg-white px-4 py-2 text-[14px]" />
      </form>
      <Filters base="/admin/orders" current={status} options={Object.fromEntries(ORDER_STATUSES.map((s) => [s, statusLabel[s]]))} />
      {orders.length === 0 ? (
        <Empty text="Няма поръчки." />
      ) : (
        <Table head={["Номер", "Дата", "Клиент", "Плащане", "Статус", "Сума"]}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-cloud/50">
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="font-medium text-link">
                  {o.number}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-mute">{formatDate(o.createdAt)}</Td>
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
