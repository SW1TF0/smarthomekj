import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, PageHeader, inputCls, statusLabel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/money";
import { eraseCustomerData, updatePrivacyRequest, updateWithdrawal } from "../actions";

const typeLabel: Record<string, string> = {
  ACCESS: "Достъп до данни",
  PORTABILITY: "Преносимост",
  RECTIFICATION: "Коригиране",
  ERASURE: "Изтриване",
  OBJECTION: "Възражение",
};

function daysLeft(created: Date, days: number) {
  return Math.ceil((created.getTime() + days * 86400000 - Date.now()) / 86400000);
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ erased?: string }> }) {
  const admin = await requireAdmin();
  const { erased } = await searchParams;
  const [privacy, withdrawals, consents] = await Promise.all([
    db.privacyRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.withdrawalRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.consentRecord.groupBy({ by: ["analytics", "marketing"], _count: true }),
  ]);
  const orderIds = Object.fromEntries(
    (await db.order.findMany({ where: { number: { in: withdrawals.map((w) => w.orderNumber) } }, select: { id: true, number: true } })).map((o) => [o.number, o.id]),
  );

  return (
    <>
      <PageHeader title="GDPR и откази" subtitle="Искания за лични данни (срок 30 дни) и откази от договор (възстановяване до 14 дни)." />
      {erased && <p className="mb-4 rounded-2xl bg-green-50 p-3 text-[14px] text-green-800">Данните за {erased} са изтрити.</p>}

      <h2 className="mb-3 text-[19px] font-semibold">Откази от договор</h2>
      <div className="mb-10 space-y-3">
        {withdrawals.length === 0 && <p className="text-[14px] text-mute">Няма откази.</p>}
        {withdrawals.map((w) => {
          const left = daysLeft(w.createdAt, 14);
          return (
            <Card key={w.id}>
              <p className="font-semibold">
                {orderIds[w.orderNumber] ? (
                  <Link href={`/admin/orders/${orderIds[w.orderNumber]}`} className="text-link">
                    {w.orderNumber}
                  </Link>
                ) : (
                  <span>{w.orderNumber} <span className="text-[12px] text-danger">(не е намерена)</span></span>
                )}{" "}
                <Badge value={w.status} />
                {w.status !== "REFUNDED" && w.status !== "REJECTED" && (
                  <span className={`ml-2 text-[12px] ${left <= 3 ? "text-danger" : "text-mute"}`}>остават {left} дни за възстановяване</span>
                )}
              </p>
              <p className="text-[13px] text-mute">
                {w.name} · {w.email} · {formatDate(w.createdAt)}
              </p>
              <p className="mt-2 text-[14px]">Продукти: {w.items}</p>
              {w.reason && <p className="text-[14px] text-mute">Причина: {w.reason}</p>}
              <form action={updateWithdrawal.bind(null, w.id)} className="mt-3 flex flex-wrap gap-3">
                <select name="status" defaultValue={w.status} className={`${inputCls} w-auto`}>
                  {["RECEIVED", "APPROVED", "REFUNDED", "REJECTED"].map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={w.notes ?? ""} placeholder="Бележки" className={`${inputCls} min-w-[200px] flex-1`} />
                <button className="btn btn-primary btn-sm">Запази</button>
              </form>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 text-[19px] font-semibold">Искания по GDPR</h2>
      <div className="mb-10 space-y-3">
        {privacy.length === 0 && <p className="text-[14px] text-mute">Няма искания.</p>}
        {privacy.map((r) => {
          const left = daysLeft(r.createdAt, 30);
          return (
            <Card key={r.id}>
              <p className="font-semibold">
                {typeLabel[r.type]} <Badge value={r.status} />
                {r.status !== "DONE" && r.status !== "REJECTED" && (
                  <span className={`ml-2 text-[12px] ${left <= 5 ? "text-danger" : "text-mute"}`}>остават {left} дни</span>
                )}
              </p>
              <p className="text-[13px] text-mute">
                {r.name} · {r.email} · {formatDate(r.createdAt)}
              </p>
              {r.message && <p className="mt-2 text-[14px]">{r.message}</p>}
              <form action={updatePrivacyRequest.bind(null, r.id)} className="mt-3 flex flex-wrap gap-3">
                <select name="status" defaultValue={r.status} className={`${inputCls} w-auto`}>
                  {["OPEN", "IN_PROGRESS", "DONE", "REJECTED"].map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={r.notes ?? ""} placeholder="Как е изпълнено" className={`${inputCls} min-w-[200px] flex-1`} />
                <button className="btn btn-primary btn-sm">Запази</button>
              </form>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Експорт / изтриване на данни за клиент</h2>
          <p className="mb-3 text-[13px] text-mute">
            Експортът дава всички данни за даден имейл в JSON (право на достъп и преносимост). Изтриването премахва запитвания и чатове. Поръчките и фактурите се пазят 10 години по Закона за счетоводството.
          </p>
          <form action="/admin/export" method="get" className="mb-3 flex gap-2">
            <input name="email" type="email" required placeholder="client@example.com" className={inputCls} />
            <button className="btn btn-sm bg-cloud">Експорт</button>
          </form>
          {admin.role === "ADMIN" && (
            <form action={eraseCustomerData} className="flex gap-2">
              <input name="email" type="email" required placeholder="client@example.com" className={inputCls} />
              <ConfirmButton message="Изтриването е окончателно. Продължаване?" className="btn btn-sm bg-red-50 text-danger">
                Изтрий
              </ConfirmButton>
            </form>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Съгласия за бисквитки</h2>
          <ul className="space-y-1 text-[14px]">
            {consents.map((c) => (
              <li key={`${c.analytics}-${c.marketing}`}>
                Аналитични: {c.analytics ? "да" : "не"}, маркетинг: {c.marketing ? "да" : "не"} — <b>{c._count}</b>
              </li>
            ))}
            {!consents.length && <li className="text-mute">Още няма записи.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
