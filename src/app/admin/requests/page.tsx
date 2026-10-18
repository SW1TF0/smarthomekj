"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminForm, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, Loading, PageHeader, inputCls, statusLabel } from "@/components/admin/ui";
import {
  consentCounts,
  eraseCustomerData,
  exportCustomerData,
  listPrivacyRequests,
  listWithdrawals,
  orderIdsByNumber,
  toDate,
  updateRow,
  useAdminData,
} from "@/lib/admin-store";
import { formatDate } from "@/lib/money";

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

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function RequestsPage() {
  const admin = useAdmin();
  const [erased, setErased] = useState("");
  const { data, error, reload } = useAdminData(async () => {
    const [privacy, withdrawals, consents] = await Promise.all([listPrivacyRequests(), listWithdrawals(), consentCounts()]);
    const orderIds = await orderIdsByNumber(Array.from(new Set(withdrawals.map((w) => w.orderNumber))));
    return { privacy, withdrawals, consents, orderIds };
  });
  if (!data) return <Loading error={error} />;
  const { privacy, withdrawals, consents, orderIds } = data;

  return (
    <>
      <PageHeader title="GDPR и откази" subtitle="Искания за лични данни (срок 30 дни) и откази от договор (възстановяване до 14 дни)." />
      {erased && <p className="mb-4 rounded-2xl bg-green-50 p-3 text-[14px] text-green-800">Данните за {erased} са изтрити.</p>}

      <h2 className="mb-3 text-[19px] font-semibold">Откази от договор</h2>
      <div className="mb-10 space-y-3">
        {withdrawals.length === 0 && <p className="text-[14px] text-mute">Няма откази.</p>}
        {withdrawals.map((w) => {
          const left = daysLeft(toDate(w.createdAt), 14);
          return (
            <Card key={w.id}>
              <p className="font-semibold">
                {orderIds[w.orderNumber] ? (
                  <Link href={`/admin/orders/view/?id=${orderIds[w.orderNumber]}`} className="text-link">
                    {w.orderNumber}
                  </Link>
                ) : (
                  <span>
                    {w.orderNumber} <span className="text-[12px] text-danger">(не е намерена)</span>
                  </span>
                )}{" "}
                <Badge value={w.status} />
                {w.status !== "REFUNDED" && w.status !== "REJECTED" && (
                  <span className={`ml-2 text-[12px] ${left <= 3 ? "text-danger" : "text-mute"}`}>остават {left} дни за възстановяване</span>
                )}
              </p>
              <p className="text-[13px] text-mute">
                {w.name} · {w.email} · {formatDate(toDate(w.createdAt))}
              </p>
              <p className="mt-2 text-[14px]">Продукти: {w.items}</p>
              {w.reason && <p className="text-[14px] text-mute">Причина: {w.reason}</p>}
              <AdminForm
                className="mt-3 flex flex-wrap items-end gap-3"
                successText=""
                onSubmit={async (f) => (await updateRow("withdrawals", w.id, { status: str(f, "status"), notes: str(f, "notes") }), reload())}
              >
                <select name="status" defaultValue={w.status} aria-label="Статус" className={`${inputCls} w-auto`}>
                  {["RECEIVED", "APPROVED", "REFUNDED", "REJECTED"].map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={w.notes ?? ""} placeholder="Бележки" aria-label="Бележки" className={`${inputCls} min-w-[200px] flex-1`} />
              </AdminForm>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 text-[19px] font-semibold">Искания по GDPR</h2>
      <div className="mb-10 space-y-3">
        {privacy.length === 0 && <p className="text-[14px] text-mute">Няма искания.</p>}
        {privacy.map((r) => {
          const left = daysLeft(toDate(r.createdAt), 30);
          return (
            <Card key={r.id}>
              <p className="font-semibold">
                {typeLabel[r.type]} <Badge value={r.status} />
                {r.status !== "DONE" && r.status !== "REJECTED" && (
                  <span className={`ml-2 text-[12px] ${left <= 5 ? "text-danger" : "text-mute"}`}>остават {left} дни</span>
                )}
              </p>
              <p className="text-[13px] text-mute">
                {r.name} · {r.email} · {formatDate(toDate(r.createdAt))}
              </p>
              {r.message && <p className="mt-2 text-[14px]">{r.message}</p>}
              <AdminForm
                className="mt-3 flex flex-wrap items-end gap-3"
                successText=""
                onSubmit={async (f) => (await updateRow("privacyRequests", r.id, { status: str(f, "status"), notes: str(f, "notes") }), reload())}
              >
                <select name="status" defaultValue={r.status} aria-label="Статус" className={`${inputCls} w-auto`}>
                  {["OPEN", "IN_PROGRESS", "DONE", "REJECTED"].map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={r.notes ?? ""} placeholder="Как е изпълнено" aria-label="Бележки" className={`${inputCls} min-w-[200px] flex-1`} />
              </AdminForm>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Експорт / изтриване на данни за клиент</h2>
          <p className="mb-3 text-[13px] text-mute">
            Експортът дава всички данни за даден имейл в JSON файл (право на достъп и преносимост). Изтриването премахва запитвания и чатове. Поръчките се пазят 10 години по Закона за счетоводството.
          </p>
          <AdminForm
            className="mb-3 flex items-start gap-2"
            submitLabel="Експорт"
            successText=""
            onSubmit={async (f) => {
              const email = str(f, "email");
              download(`smarthomekj-${email}.json`, await exportCustomerData(email));
            }}
          >
            <input name="email" type="email" required placeholder="client@example.com" aria-label="Имейл за експорт" className={inputCls} />
          </AdminForm>
          {admin.role === "ADMIN" && (
            <AdminForm
              className="flex items-start gap-2"
              submitLabel="Изтрий"
              successText=""
              onSubmit={async (f) => {
                const email = str(f, "email");
                if (!confirm(`Изтриването на данните за ${email} е окончателно. Продължаване?`)) return;
                await eraseCustomerData(email);
                setErased(email);
              }}
            >
              <input name="email" type="email" required placeholder="client@example.com" aria-label="Имейл за изтриване" className={inputCls} />
            </AdminForm>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Съгласия за бисквитки</h2>
          <ul className="space-y-1 text-[14px]">
            {consents.map((c) => (
              <li key={`${c.analytics}-${c.marketing}`}>
                Аналитични: {c.analytics ? "да" : "не"}, маркетинг: {c.marketing ? "да" : "не"} — <b>{c.count}</b>
              </li>
            ))}
            {!consents.length && <li className="text-mute">Още няма записи.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
