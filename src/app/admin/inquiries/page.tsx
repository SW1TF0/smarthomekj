"use client";

import { useState } from "react";
import { AdminForm, str } from "@/components/admin/admin-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, Empty, Filters, Loading, PageHeader, inputCls, statusLabel } from "@/components/admin/ui";
import { deleteRow, listInquiries, toDate, updateRow, useAdminData } from "@/lib/admin-store";
import { formatDate } from "@/lib/money";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default function InquiriesPage() {
  const [status, setStatus] = useState("");
  const { data, error, reload } = useAdminData(listInquiries);
  if (!data) return <Loading error={error} />;
  const inquiries = data.filter((i) => !status || i.status === status);

  return (
    <>
      <PageHeader title="Запитвания" subtitle="Заявки за консултация и оферти от формата за контакт." />
      <Filters current={status} onChange={setStatus} options={Object.fromEntries(STATUSES.map((s) => [s, statusLabel[s]]))} />
      {inquiries.length === 0 ? (
        <Empty text="Няма запитвания." />
      ) : (
        <div className="space-y-4">
          {inquiries.map((i) => (
            <Card key={i.id}>
              <p className="font-semibold">
                {i.name} <Badge value={i.status} />
              </p>
              <p className="text-[13px] text-mute">
                <a href={`mailto:${i.email}`} className="text-link">
                  {i.email}
                </a>
                {i.phone && (
                  <>
                    {" · "}
                    <a href={`tel:${i.phone}`} className="text-link">
                      {i.phone}
                    </a>
                  </>
                )}
                {" · "}
                {formatDate(toDate(i.createdAt))} · {i.locale?.toUpperCase()}
              </p>
              <p className="mt-1 text-[13px]">
                Услуга: <b>{i.service}</b>
                {i.propertyType && (
                  <>
                    {" "}
                    · Имот: <b>{i.propertyType}</b>
                  </>
                )}
              </p>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cloud p-3 text-[14px]">{i.message}</p>
              <AdminForm
                className="mt-3 flex flex-wrap items-end gap-3"
                successText=""
                onSubmit={async (f) => {
                  await updateRow("inquiries", i.id, { status: str(f, "status"), notes: str(f, "notes") });
                  reload();
                }}
              >
                <select name="status" defaultValue={i.status} aria-label="Статус" className={`${inputCls} w-auto`}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={i.notes ?? ""} placeholder="Бележки (оферта, дата на оглед…)" aria-label="Бележки" className={`${inputCls} min-w-[200px] flex-1`} />
              </AdminForm>
              <div className="mt-2">
                <ConfirmButton message="Да изтрия ли запитването?" onConfirm={async () => (await deleteRow("inquiries", i.id), reload())}>
                  Изтрий
                </ConfirmButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
