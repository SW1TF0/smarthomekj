"use client";

import Link from "next/link";
import { useState } from "react";
import { Empty, Loading, PageHeader, Table, Td } from "@/components/admin/ui";
import { listInvoices, useAdminData, type InvoiceRow } from "@/lib/admin-store";
import { formatBgDate } from "@/lib/invoice";
import { formatMoney } from "@/lib/money";

const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");

/** Register of issued documents for the accountant, as CSV that opens in Excel (semicolons, UTF-8 BOM). */
function downloadCsv(rows: InvoiceRow[], month: string) {
  const head = ["Вид", "Номер", "Дата", "Дата на дан. събитие", "Получател", "ЕИК", "ДДС №", "Данъчна основа", "ДДС", "Общо", "Плащане", "Поръчка", "Към фактура"];
  const lines = rows.map((r) => {
    // A credit note reduces the totals, so its amounts go in with a minus sign.
    const sign = r.type === "CREDIT_NOTE" ? -1 : 1;
    return [
      r.type === "INVOICE" ? "Фактура" : "Кредитно известие",
      r.number,
      formatBgDate(r.issueDate),
      formatBgDate(r.taxEventDate),
      r.buyer.name,
      r.buyer.eik,
      r.buyer.vatNumber,
      euro(sign * r.baseCents),
      euro(sign * r.vatCents),
      euro(sign * r.totalCents),
      r.paymentMethod === "BANK" ? "Банков превод" : "Наложен платеж",
      r.orderNumber,
      r.relatedNumber ?? "",
    ];
  });
  const csv = [head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `fakturi-${month || "vsichki"}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoicesPage() {
  const { data, error } = useAdminData(listInvoices);
  const [month, setMonth] = useState("");
  if (!data) return <Loading error={error} />;
  const months = [...new Set(data.map((r) => r.issueDate.slice(0, 7)))];
  const rows = data.filter((r) => !month || r.issueDate.startsWith(month));
  const sum = (pick: (r: InvoiceRow) => number) => rows.reduce((s, r) => s + (r.type === "CREDIT_NOTE" ? -1 : 1) * pick(r), 0);

  return (
    <>
      <PageHeader
        title="Фактури"
        subtitle="Фактурите се издават от страницата на всяка поръчка. Номерата вървят подред."
        action={
          rows.length > 0 && (
            <button type="button" className="btn btn-sm bg-white ring-1 ring-black/5" onClick={() => downloadCsv(rows, month)}>
              Изтегли за счетоводителя (Excel)
            </button>
          )
        }
      />
      {months.length > 0 && (
        <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Месец" className="mb-5 rounded-full border border-line bg-white px-4 py-2 text-[14px]">
          <option value="">Всички месеци</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m.slice(5)}.{m.slice(0, 4)}
            </option>
          ))}
        </select>
      )}
      {rows.length === 0 ? (
        <Empty text="Още няма издадени фактури. Отворете поръчка и натиснете „Издай фактура“." />
      ) : (
        <>
          <Table head={["Номер", "Дата", "Получател", "Основа", "ДДС", "Общо", "Поръчка"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cloud/50">
                <Td>
                  <Link href={`/admin/invoices/view/?id=${r.id}`} className="font-medium text-link">
                    {r.number}
                  </Link>
                  {r.type === "CREDIT_NOTE" && <span className="block text-[12px] text-mute">Кредитно известие към {r.relatedNumber}</span>}
                </Td>
                <Td className="whitespace-nowrap text-mute">{formatBgDate(r.issueDate)}</Td>
                <Td>
                  {r.buyer.name}
                  {r.buyer.eik && <span className="block text-[12px] text-mute">ЕИК {r.buyer.eik}</span>}
                </Td>
                <Td className="whitespace-nowrap">{formatMoney(r.baseCents)}</Td>
                <Td className="whitespace-nowrap">{formatMoney(r.vatCents)}</Td>
                <Td className="whitespace-nowrap font-medium">
                  {r.type === "CREDIT_NOTE" ? "−" : ""}
                  {formatMoney(r.totalCents)}
                </Td>
                <Td>
                  <Link href={`/admin/orders/view/?id=${r.orderId}`} className="text-link">
                    {r.orderNumber}
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-4 text-[14px] text-mute">
            Общо за периода: основа {formatMoney(sum((r) => r.baseCents))} · ДДС {formatMoney(sum((r) => r.vatCents))} ·{" "}
            <b className="text-ink">{formatMoney(sum((r) => r.totalCents))}</b>
          </p>
        </>
      )}
    </>
  );
}
