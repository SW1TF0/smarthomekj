import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, Empty, Filters, PageHeader, inputCls, statusLabel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/money";
import { deleteInquiry, updateInquiry } from "../actions";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const inquiries = await db.inquiry.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <>
      <PageHeader title="Запитвания" subtitle="Заявки за консултация и оферти от формата за контакт." />
      <Filters base="/admin/inquiries" current={status} options={Object.fromEntries(STATUSES.map((s) => [s, statusLabel[s]]))} />
      {inquiries.length === 0 ? (
        <Empty text="Няма запитвания." />
      ) : (
        <div className="space-y-4">
          {inquiries.map((i) => (
            <Card key={i.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
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
                    {formatDate(i.createdAt)} · {i.locale.toUpperCase()}
                  </p>
                  <p className="mt-1 text-[13px]">
                    Услуга: <b>{i.service}</b>
                    {i.propertyType && <> · Имот: <b>{i.propertyType}</b></>}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cloud p-3 text-[14px]">{i.message}</p>
              <form action={updateInquiry.bind(null, i.id)} className="mt-3 flex flex-wrap items-end gap-3">
                <select name="status" defaultValue={i.status} className={`${inputCls} w-auto`}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <input name="notes" defaultValue={i.notes ?? ""} placeholder="Бележки (оферта, дата на оглед…)" className={`${inputCls} flex-1 min-w-[200px]`} />
                <button className="btn btn-primary btn-sm">Запази</button>
              </form>
              <form action={deleteInquiry.bind(null, i.id)} className="mt-2">
                <ConfirmButton message="Да изтрия ли запитването?">Изтрий</ConfirmButton>
              </form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
