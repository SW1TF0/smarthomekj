"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, Loading, PageHeader } from "@/components/admin/ui";
import { listAllProducts, listInquiries, listOrders, loadStarterData, toDate, useAdminData } from "@/lib/admin-store";
import { formatDate, formatMoney } from "@/lib/money";
import { starterProducts } from "@/lib/products";

const DISMISS_KEY = "shkj_admin_hidden_starter";

export default function Dashboard() {
  const admin = useAdmin();
  const [seeding, setSeeding] = useState("");
  const [hidden, setHidden] = useState<string | null>("");
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISS_KEY));
    } catch {
      setHidden(null);
    }
  }, []);
  const { data, error, reload } = useAdminData(() => Promise.all([listOrders(), listInquiries(), listAllProducts()]));
  if (!data) return <Loading error={error} />;
  const [orders, inquiries, products] = data;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonth = orders.filter((o) => toDate(o.createdAt) >= monthStart);
  const revenue = thisMonth.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s, o) => s + o.totalCents, 0);
  // Products added to the starter catalogue after the shop was set up (e.g. for the price calculator).
  const missing = products.length ? starterProducts.filter((p) => !products.some((x) => x.slug === p.slug)) : [];
  const missingKey = missing.map((p) => p.slug).join(",");
  const lowStock = products.filter((p) => p.active && p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6);

  const stats = [
    { label: "Оборот този месец", value: formatMoney(revenue), href: "/admin/orders/" },
    { label: "Поръчки този месец", value: thisMonth.length, href: "/admin/orders/" },
    { label: "Чакат потвърждение", value: orders.filter((o) => o.status === "PENDING").length, href: "/admin/orders/" },
    { label: "Нови запитвания", value: inquiries.filter((i) => i.status === "NEW").length, href: "/admin/inquiries/" },
    { label: "Продукти в магазина", value: products.filter((p) => p.active).length, href: "/admin/products/" },
  ];

  return (
    <>
      <PageHeader title={`Здравейте, ${admin.name.split(" ")[0]}`} subtitle="Какво се случва в SmartHomeKJ днес." />

      {products.length === 0 && (
        <Card className="mb-6 bg-blue-50 ring-blue-100">
          <h2 className="font-semibold">Заредете началните продукти</h2>
          <p className="mt-1 text-[14px] text-ink-2">Магазинът показва примерния каталог. Заредете го в базата, за да редактирате цени, наличности и въпроси.</p>
          <button
            className="btn btn-primary btn-sm mt-4"
            disabled={seeding === "busy"}
            onClick={async () => {
              setSeeding("busy");
              try {
                await loadStarterData();
                setSeeding("");
                reload();
              } catch (e) {
                setSeeding((e as Error).message);
              }
            }}
          >
            {seeding === "busy" ? "Зареждане…" : "Зареди продуктите и въпросите"}
          </button>
          {seeding && seeding !== "busy" && <p className="mt-2 text-[13px] text-danger">{seeding}</p>}
        </Card>
      )}

      {missing.length > 0 && hidden !== missingKey && (
        <Card className="mb-6 bg-blue-50 ring-blue-100">
          <h2 className="font-semibold">Нови продукти в началния каталог</h2>
          <p className="mt-1 text-[14px] text-ink-2">
            {missing.map((p) => p.translations.bg?.name ?? p.slug).join(", ")}. Калкулаторът на сайта ги използва. Добавете ги в магазина, за да ги продавате и да редактирате цената им.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="btn btn-primary btn-sm"
              disabled={seeding === "busy"}
              onClick={async () => {
                setSeeding("busy");
                try {
                  await loadStarterData();
                  setSeeding("");
                  reload();
                } catch (e) {
                  setSeeding((e as Error).message);
                }
              }}
            >
              {seeding === "busy" ? "Зареждане…" : "Добави ги"}
            </button>
            <button
              className="btn btn-sm text-ink-2 hover:bg-white"
              onClick={() => {
                try {
                  localStorage.setItem(DISMISS_KEY, missingKey);
                } catch {}
                setHidden(missingKey);
              }}
            >
              Не ми трябват
            </button>
          </div>
          {seeding && seeding !== "busy" && <p className="mt-2 text-[13px] text-danger">{seeding}</p>}
        </Card>
      )}

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
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/view/?id=${o.id}`} className="flex items-center justify-between gap-3 py-3 text-[14px] hover:bg-cloud/50">
                  <span>
                    <span className="font-medium">{o.number}</span> · {o.name}
                    <span className="block text-[12px] text-mute">{formatDate(toDate(o.createdAt))}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge value={o.status} />
                    <span className="font-medium">{formatMoney(o.totalCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
            {!orders.length && <li className="py-3 text-[14px] text-mute">Все още няма поръчки.</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Ниска наличност</h2>
            <ul className="space-y-2 text-[14px]">
              {lowStock.map((p) => (
                <li key={p.slug} className="flex justify-between">
                  <Link href={`/admin/products/edit/?id=${p.slug}`} className="text-link">
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
              {inquiries.slice(0, 5).map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <Link href="/admin/inquiries/" className="truncate text-link">
                    {i.name}
                  </Link>
                  <Badge value={i.status} />
                </li>
              ))}
              {!inquiries.length && <li className="text-mute">Няма запитвания.</li>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">Безплатният план</h2>
            <p className="text-[13px] text-mute">
              Плащане с наложен платеж или банков превод. Имейли до клиентите се пращат с бутона „Пиши на клиента“ в поръчката. Чатът отговаря от „Въпроси и отговори“.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
