"use client";

import Link from "next/link";
import { useState } from "react";
import { invoiceEmail, orderConfirmationEmail } from "@/lib/documents";
import { emailConfigured, sendEmail } from "@/lib/email";
import { issueInvoice, logOrderEmail, markInvoiceSent, type InvoiceRow } from "@/lib/admin-store";
import { amountsFor, buyerFromOrder, formatBgDate, missingSellerFields, NOT_VAT_REGISTERED_NOTE, sellerFrom, sofiaDate, type InvoiceDoc } from "@/lib/invoice";
import { formatMoney } from "@/lib/money";
import type { SiteSettings } from "@/lib/settings";
import type { OrderDoc } from "@/lib/store";
import { AdminForm, str } from "./admin-form";
import { Card, inputCls, labelCls } from "./ui";

const kindLabel: Record<string, string> = {
  confirmation: "Потвърждение на поръчката",
  status: "Нов статус",
  invoice: "Фактура",
  credit: "Кредитно известие",
};

/** Invoices, credit notes and emails for one order. */
export function OrderDocuments({ order, settings, invoices, reload }: { order: OrderDoc; settings: SiteSettings; invoices: InvoiceRow[]; reload: () => void }) {
  const [mode, setMode] = useState<"" | "invoice" | "credit">("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const mailOn = emailConfigured(settings);
  const missing = missingSellerFields(settings);
  const invoice = invoices.find((i) => i.type === "INVOICE");
  const credited = invoices.some((i) => i.type === "CREDIT_NOTE");
  const buyer = buyerFromOrder(order);

  async function mail(kind: string, message: { subject: string; html: string }, after?: () => Promise<void>) {
    setBusy(kind);
    setNote(null);
    try {
      await sendEmail(settings, order.email, message);
      await after?.();
      await logOrderEmail(order.id, { kind, to: order.email, at: new Date().toISOString(), ok: true });
      setNote({ ok: true, text: `Изпратено до ${order.email}.` });
      reload();
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Имейлът не беше изпратен." });
    } finally {
      setBusy("");
    }
  }

  const sendInvoice = (inv: InvoiceRow) =>
    mail(inv.type === "INVOICE" ? "invoice" : "credit", invoiceEmail(inv, settings, order.name), () => markInvoiceSent(inv.id));

  async function issue(f: FormData, type: InvoiceDoc["type"]) {
    if (missing.length) return `Първо попълнете в Настройки: ${missing.join(", ")}.`;
    const base = type === "CREDIT_NOTE" && invoice ? invoice : null;
    const amounts = base
      ? { lines: base.lines, vatRate: base.vatRate, vatCents: base.vatCents, baseCents: base.baseCents, totalCents: base.totalCents }
      : amountsFor(order, settings.vatRegistered);
    const data: Omit<InvoiceDoc, "number" | "seq"> = {
      type,
      issueDate: sofiaDate(),
      taxEventDate: str(f, "taxEventDate") || sofiaDate(),
      place: settings.invoicePlace || settings.city,
      orderId: order.id,
      orderNumber: order.number,
      email: order.email,
      locale: order.locale,
      seller: base ? base.seller : sellerFrom(settings),
      buyer: base
        ? base.buyer
        : {
            isCompany: f.get("isCompany") === "on",
            name: str(f, "name"),
            eik: str(f, "eik"),
            vatNumber: str(f, "vatNumber"),
            address: str(f, "address"),
            mol: str(f, "mol"),
          },
      ...amounts,
      vatNote: base ? base.vatNote : settings.vatRegistered ? "" : NOT_VAT_REGISTERED_NOTE,
      paymentMethod: order.paymentMethod,
      compiledBy: settings.invoiceCompiler,
      ...(base ? { relatedNumber: base.number, reason: str(f, "reason") || "Отказ от поръчката" } : {}),
    };
    if (!data.buyer.name || !data.buyer.address) return "Попълнете име и адрес на получателя.";
    const created = await issueInvoice(data, settings.invoiceStartNumber);
    setMode("");
    if (f.get("send") === "on" && mailOn) await sendInvoice(created);
    reload();
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Документи и имейли</h2>
        {!mailOn && (
          <Link href="/admin/settings/#emails" className="text-[13px] text-link">
            Включете имейлите →
          </Link>
        )}
      </div>

      {invoices.length > 0 && (
        <ul className="mb-4 divide-y divide-line rounded-2xl ring-1 ring-line">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-[14px]">
              <span>
                <b>{inv.type === "INVOICE" ? "Фактура" : "Кредитно известие"}</b> № {inv.number}
                <span className="block text-[12px] text-mute">
                  {formatBgDate(inv.issueDate)} · {formatMoney(inv.totalCents)} · {inv.sentAt ? "изпратена на клиента" : "още не е изпратена"}
                </span>
              </span>
              <span className="flex gap-2">
                <Link href={`/admin/invoices/view/?id=${inv.id}`} className="btn btn-sm bg-cloud">
                  Отвори / PDF
                </Link>
                {mailOn && (
                  <button type="button" className="btn btn-sm bg-cloud" disabled={!!busy} onClick={() => sendInvoice(inv)}>
                    {busy === "invoice" || busy === "credit" ? "…" : "Изпрати"}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {!invoice && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode(mode === "invoice" ? "" : "invoice")}>
            Издай фактура
          </button>
        )}
        {invoice && !credited && (
          <button type="button" className="btn btn-sm bg-cloud" onClick={() => setMode(mode === "credit" ? "" : "credit")}>
            Кредитно известие
          </button>
        )}
        {mailOn && (
          <button
            type="button"
            className="btn btn-sm bg-cloud"
            disabled={!!busy}
            onClick={() => mail("confirmation", orderConfirmationEmail(order, settings, order.createdAt?.toDate() ?? new Date()))}
          >
            {busy === "confirmation" ? "…" : "Изпрати потвърждението пак"}
          </button>
        )}
      </div>

      {note && (
        <p className={`mt-3 text-[14px] ${note.ok ? "text-success" : "text-danger"}`} role="status">
          {note.text}
        </p>
      )}

      {mode !== "" && missing.length > 0 && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-[14px] text-amber-800">
          За фактура трябват истинските данни на фирмата. Попълнете в{" "}
          <Link href="/admin/settings/" className="underline">
            Настройки
          </Link>
          : {missing.join(", ")}.
        </p>
      )}

      {mode === "invoice" && (
        <AdminForm className="mt-5 space-y-4 rounded-2xl bg-cloud/60 p-4" submitLabel="Издай фактурата" successText="" onSubmit={(f) => issue(f, "INVOICE")}>
          <p className="text-[13px] text-mute">Проверете данните на клиента. След издаване фактурата не може да се променя, само да се анулира с кредитно известие.</p>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="isCompany" defaultChecked={buyer.isCompany} /> Клиентът е фирма
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="name" label="Име / фирма" value={buyer.name} />
            <Field name="eik" label="ЕИК (за фирма)" value={buyer.eik} />
            <Field name="vatNumber" label="ДДС № (ако има)" value={buyer.vatNumber} />
            <Field name="mol" label="МОЛ (по желание)" value={buyer.mol} />
            <div className="sm:col-span-2">
              <Field name="address" label="Адрес" value={buyer.address} />
            </div>
            <Field name="taxEventDate" label="Дата на данъчното събитие (доставка / плащане)" value={sofiaDate()} type="date" />
          </div>
          <Summary order={order} vatRegistered={settings.vatRegistered} />
          {mailOn && (
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" name="send" defaultChecked /> Изпрати фактурата на {order.email}
            </label>
          )}
        </AdminForm>
      )}

      {mode === "credit" && invoice && (
        <AdminForm className="mt-5 space-y-4 rounded-2xl bg-cloud/60 p-4" submitLabel="Издай кредитно известие" successText="" onSubmit={(f) => issue(f, "CREDIT_NOTE")}>
          <p className="text-[13px] text-mute">Анулира цялата фактура № {invoice.number} ({formatMoney(invoice.totalCents)}). Използвайте го при отказ или връщане.</p>
          <Field name="reason" label="Основание" value="Отказ от поръчката" />
          <Field name="taxEventDate" label="Дата" value={sofiaDate()} type="date" />
          {mailOn && (
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" name="send" defaultChecked /> Изпрати го на {order.email}
            </label>
          )}
        </AdminForm>
      )}

      {order.emails && order.emails.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-2 text-[13px] font-medium text-mute">Изпратени имейли</h3>
          <ul className="space-y-1 text-[13px]">
            {[...order.emails].reverse().map((e, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{kindLabel[e.kind] ?? e.kind}</span>
                <span className="text-mute">{new Date(e.at).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Sofia" })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 text-[12px] text-mute">
        Касова бележка не се издава от сайта: при наложен платеж я дава куриерът, а при банков превод не е нужна. Потвърждението на поръчката служи за електронна бележка.
      </p>
    </Card>
  );
}

function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string; type?: string }) {
  return (
    <div>
      <label className={labelCls} htmlFor={`inv-${name}`}>
        {label}
      </label>
      <input id={`inv-${name}`} name={name} type={type} defaultValue={value} className={inputCls} />
    </div>
  );
}

function Summary({ order, vatRegistered }: { order: OrderDoc; vatRegistered: boolean }) {
  const a = amountsFor(order, vatRegistered);
  return (
    <dl className="grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-[13px]">
      <div>
        <dt className="text-mute">Данъчна основа</dt>
        <dd className="font-medium">{formatMoney(a.baseCents)}</dd>
      </div>
      <div>
        <dt className="text-mute">ДДС {a.vatRate}%</dt>
        <dd className="font-medium">{formatMoney(a.vatCents)}</dd>
      </div>
      <div>
        <dt className="text-mute">Общо</dt>
        <dd className="font-medium">{formatMoney(a.totalCents)}</dd>
      </div>
    </dl>
  );
}
