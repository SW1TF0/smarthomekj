import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/money";
import { cardPaymentsEnabled } from "@/lib/stripe";

export default async function Dashboard() {
  const admin = await requireAdmin();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [revenue, ordersMonth, openOrders, newInquiries, openChats, lowStock, recentOrders, recentInquiries] = await Promise.all([
    db.order.aggregate({ _sum: { totalCents: true }, where: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
    db.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.chatConversation.count({ where: { mode: "HUMAN" } }),
    db.product.findMany({ where: { active: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 6 }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Оборот този месец", value: formatMoney(revenue._sum.totalCents ?? 0), href: "/admin/orders" },
    { label: "Поръчки този месец", value: ordersMonth, href: "/admin/orders" },
    { label: "За обработка", value: openOrders, href: "/admin/orders?status=PAID" },
    { label: "Нови запитвания", value: newInquiries, href: "/admin/inquiries?status=NEW" },
    { label: "Чакат човек в чата", value: openChats, href: "/admin/chats" },
  ];

  const setup = [
    { done: cardPaymentsEnabled(), text: "Плащания с карта (STRIPE_SECRET_KEY)" },
    { done: !!process.env.ANTHROPIC_API_KEY, text: "AI отговори в чата (ANTHROPIC_API_KEY)" },
    { done: !!process.env.SMTP_HOST, text: "Имейли към клиенти (SMTP_HOST)" },
  ];

  return (
    <>
      <PageHeader title={`Здравейте, ${admin.name.split(" ")[0]}`} subtitle="Какво се случва в SmartHomeKJ днес." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="text-[13px] text-mute">{s.label}</p>
              <p className="mt-2 text-[28px] font-bold tracking-tight">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-semibold">Последни поръчки</h2>
          <ul className="divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-[14px] hover:bg-cloud/50">
                  <span>
                    <span className="font-medium">{o.number}</span> · {o.name}
                    <span className="block text-[12px] text-mute">{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge value={o.status} />
                    <span className="font-medium">{formatMoney(o.totalCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
            {!recentOrders.length && <li className="py-3 text-[14px] text-mute">Все още няма поръчки.</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Ниска наличност</h2>
            <ul className="space-y-2 text-[14px]">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link href={`/admin/products/${p.id}`} className="text-link">
                    {p.sku}
                  </Link>
                  <span className={p.stock === 0 ? "text-danger" : "text-amber-600"}>{p.stock} бр.</span>
                </li>
              ))}
              {!lowStock.length && <li className="text-mute">Всичко е налично.</li>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Нови запитвания</h2>
            <ul className="space-y-2 text-[14px]">
              {recentInquiries.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <Link href="/admin/inquiries" className="truncate text-link">
                    {i.name}
                  </Link>
                  <Badge value={i.status} />
                </li>
              ))}
              {!recentInquiries.length && <li className="text-mute">Няма запитвания.</li>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Настройка</h2>
            <ul className="space-y-2 text-[13px]">
              {setup.map((s) => (
                <li key={s.text} className={s.done ? "text-success" : "text-amber-700"}>
                  {s.done ? "✓" : "○"} {s.text}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
