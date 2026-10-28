"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Empty, Loading } from "@/components/admin/ui";
import { getInvoice, useAdminData } from "@/lib/admin-store";
import { invoiceBody } from "@/lib/documents";

// Printing hides the admin menu, so "Запази като PDF" in the print window gives a clean A4 invoice.
const printCss = `@page { size: A4; margin: 14mm; }
@media print {
  body { background: #fff !important; }
  aside, .no-print { display: none !important; }
  main { padding: 0 !important; }
  .sheet { box-shadow: none !important; padding: 0 !important; max-width: none !important; }
}`;

export default function InvoiceViewPage() {
  const id = useSearchParams().get("id") ?? "";
  const { data, error } = useAdminData(async () => ({ invoice: await getInvoice(id) }), [id]);
  if (!data) return <Loading error={error} />;
  const inv = data.invoice;
  if (!inv) return <Empty text="Документът не е намерен." />;

  return (
    <>
      <style>{printCss}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/orders/view/?id=${inv.orderId}`} className="text-[14px] text-link">
          ← Поръчка {inv.orderNumber}
        </Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          Печат / Запази като PDF
        </button>
      </div>
      {/* The same HTML the customer receives by email; every value in it is escaped in invoiceBody. */}
      <div className="sheet mx-auto max-w-[800px] rounded-[20px] bg-white p-8 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 print:ring-0" dangerouslySetInnerHTML={{ __html: invoiceBody(inv) }} />
      <p className="no-print mx-auto mt-4 max-w-[800px] text-[12px] text-mute">В прозореца за печат изберете „Запази като PDF“ (Save as PDF), за да изтеглите файла.</p>
    </>
  );
}
