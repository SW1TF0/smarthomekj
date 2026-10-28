import type { Locale } from "@/i18n/config";
import { amountInWordsBg, formatBgDate, type InvoiceDoc } from "./invoice";
import { formatMoney } from "./money";
import type { SiteSettings } from "./settings";
import type { OrderInput } from "./store";

// HTML for emails and printable documents. Inline styles only, because email apps drop <style> and classes.
// The same HTML is shown on the admin's print page, so what the customer gets is what the admin sees.

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const ink = "#1d1d1f";
const mute = "#6e6e73";
const line = "#e5e5ea";

function shell(inner: string, footer: string) {
  return `<div style="background:#f5f5f7;padding:32px 12px;font-family:${font};color:${ink}">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:20px;padding:32px 28px">${inner}</div>
<p style="max-width:640px;margin:16px auto 0;text-align:center;font-size:12px;line-height:1.5;color:${mute}">${footer}</p>
</div>`;
}

const cell = (v: string, extra = "") => `<td style="padding:8px 6px;border-bottom:1px solid ${line};font-size:13px;vertical-align:top;${extra}">${v}</td>`;
const head = (v: string, extra = "") =>
  `<th style="padding:8px 6px;border-bottom:1px solid ${line};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:${mute};text-align:left;${extra}">${v}</th>`;
const row = (label: string, value: string, strong = false) =>
  `<tr><td style="padding:3px 0;font-size:${strong ? 16 : 13}px;color:${strong ? ink : mute};${strong ? "font-weight:600" : ""}">${label}</td><td style="padding:3px 0;text-align:right;font-size:${strong ? 16 : 13}px;${strong ? "font-weight:600" : ""}">${value}</td></tr>`;

// ---------- Customer messages (bg / en / tr) ----------

type Words = {
  hello: string;
  thanks: string;
  confirmTitle: string;
  confirmLead: string;
  order: string;
  date: string;
  product: string;
  qty: string;
  price: string;
  subtotal: string;
  shipping: string;
  free: string;
  total: string;
  vat: string;
  payment: string;
  cod: string;
  codNote: string;
  bank: string;
  bankNote: string;
  delivery: string;
  notReceipt: string;
  withdraw: string;
  questions: string;
  status: Record<string, string>;
  statusTitle: string;
  tracking: string;
  invoiceTitle: string;
  invoiceLead: string;
  creditTitle: string;
  creditLead: string;
};

const words: Record<Locale, Words> = {
  bg: {
    hello: "Здравейте",
    thanks: "Благодарим Ви за поръчката!",
    confirmTitle: "Поръчката е приета",
    confirmLead: "Ще Ви се обадим, за да я потвърдим. Ето какво поръчахте.",
    order: "Поръчка",
    date: "Дата",
    product: "Продукт",
    qty: "Бр.",
    price: "Сума",
    subtotal: "Междинна сума",
    shipping: "Доставка",
    free: "Безплатна",
    total: "Общо",
    vat: "в т.ч. ДДС 20%",
    payment: "Плащане",
    cod: "Наложен платеж",
    codNote: "Плащате на куриера при доставка. Куриерът Ви дава касовата бележка.",
    bank: "Банков превод",
    bankNote: "Преведете {amount} по IBAN {iban} ({bank}), основание: {number}.",
    delivery: "Доставка до",
    notReceipt: "Това е електронно потвърждение на поръчката. Не е фискален бон.",
    withdraw: "Имате право да се откажете от покупката в 14-дневен срок от получаването.",
    questions: "Въпроси? Отговорете на този имейл или ни се обадете на",
    status: {
      PROCESSING: "Потвърдихме поръчката Ви. Подготвяме я за изпращане.",
      SHIPPED: "Поръчката Ви е изпратена.",
      DELIVERED: "Поръчката Ви е доставена. Благодарим Ви!",
      CANCELLED: "Поръчката Ви е отказана. Ако не сте поискали това, пишете ни.",
      REFUNDED: "Възстановихме сумата по поръчката Ви.",
    },
    statusTitle: "Новини за поръчката",
    tracking: "Номер на пратката",
    invoiceTitle: "Вашата фактура",
    invoiceLead: "Изпращаме Ви фактурата за поръчката. Можете да я разпечатате или запазите.",
    creditTitle: "Кредитно известие",
    creditLead: "Изпращаме Ви кредитно известие към фактурата за поръчката.",
  },
  en: {
    hello: "Hello",
    thanks: "Thank you for your order!",
    confirmTitle: "We have your order",
    confirmLead: "We will call you to confirm it. Here is what you ordered.",
    order: "Order",
    date: "Date",
    product: "Product",
    qty: "Qty",
    price: "Amount",
    subtotal: "Subtotal",
    shipping: "Delivery",
    free: "Free",
    total: "Total",
    vat: "incl. VAT 20%",
    payment: "Payment",
    cod: "Cash on delivery",
    codNote: "You pay the courier on delivery. The courier gives you the receipt.",
    bank: "Bank transfer",
    bankNote: "Please transfer {amount} to IBAN {iban} ({bank}), reference: {number}.",
    delivery: "Delivery to",
    notReceipt: "This is an electronic order confirmation, not a fiscal receipt.",
    withdraw: "You may withdraw from the purchase within 14 days of receiving it.",
    questions: "Questions? Reply to this email or call us on",
    status: {
      PROCESSING: "Your order is confirmed. We are getting it ready to ship.",
      SHIPPED: "Your order is on its way.",
      DELIVERED: "Your order has been delivered. Thank you!",
      CANCELLED: "Your order has been cancelled. If you did not ask for this, please write to us.",
      REFUNDED: "We have refunded your order.",
    },
    statusTitle: "Order update",
    tracking: "Tracking number",
    invoiceTitle: "Your invoice",
    invoiceLead: "Here is the invoice for your order (in Bulgarian, as the law requires). You can print or save it.",
    creditTitle: "Credit note",
    creditLead: "Here is a credit note for the invoice of your order.",
  },
  tr: {
    hello: "Merhaba",
    thanks: "Siparişiniz için teşekkür ederiz!",
    confirmTitle: "Siparişinizi aldık",
    confirmLead: "Onaylamak için sizi arayacağız. Sipariş ettikleriniz:",
    order: "Sipariş",
    date: "Tarih",
    product: "Ürün",
    qty: "Adet",
    price: "Tutar",
    subtotal: "Ara toplam",
    shipping: "Teslimat",
    free: "Ücretsiz",
    total: "Toplam",
    vat: "KDV %20 dahil",
    payment: "Ödeme",
    cod: "Kapıda ödeme",
    codNote: "Teslimatta kuryeye ödersiniz. Fişi kurye verir.",
    bank: "Banka havalesi",
    bankNote: "Lütfen {amount} tutarını IBAN {iban} ({bank}) hesabına gönderin, açıklama: {number}.",
    delivery: "Teslimat adresi",
    notReceipt: "Bu, elektronik sipariş onayıdır; mali fiş değildir.",
    withdraw: "Ürünü teslim aldıktan sonra 14 gün içinde cayma hakkınız vardır.",
    questions: "Sorunuz mu var? Bu e-postayı yanıtlayın veya bizi arayın:",
    status: {
      PROCESSING: "Siparişiniz onaylandı. Gönderime hazırlıyoruz.",
      SHIPPED: "Siparişiniz kargoya verildi.",
      DELIVERED: "Siparişiniz teslim edildi. Teşekkür ederiz!",
      CANCELLED: "Siparişiniz iptal edildi. Bunu siz istemediyseniz bize yazın.",
      REFUNDED: "Siparişinizin tutarını iade ettik.",
    },
    statusTitle: "Sipariş güncellemesi",
    tracking: "Kargo takip numarası",
    invoiceTitle: "Faturanız",
    invoiceLead: "Siparişinizin faturası ektedir (yasa gereği Bulgarca). Yazdırabilir veya kaydedebilirsiniz.",
    creditTitle: "Alacak dekontu",
    creditLead: "Siparişinizin faturasına ait alacak dekontu ektedir.",
  },
};

const w = (locale: string) => words[(locale as Locale) in words ? (locale as Locale) : "bg"];

function sellerFooter(s: SiteSettings) {
  return `${esc(s.legalName)} · ЕИК ${esc(s.eik)} · ${esc(s.address)}, ${esc(s.city)}<br>${esc(s.email)} · ${esc(s.phone)}`;
}

function itemsTable(order: OrderInput, locale: string) {
  const t = w(locale);
  const m = (c: number) => formatMoney(c, locale as Locale);
  const rows = order.items
    .map((i) => `<tr>${cell(esc(i.name))}${cell(String(i.quantity), "text-align:center")}${cell(m(i.priceCents * i.quantity), "text-align:right;white-space:nowrap")}</tr>`)
    .join("");
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:20px">
<tr>${head(t.product)}${head(t.qty, "text-align:center")}${head(t.price, "text-align:right")}</tr>${rows}</table>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:12px">
${row(t.subtotal, m(order.subtotalCents))}${row(t.shipping, order.shippingCents ? m(order.shippingCents) : t.free)}${row(t.total, m(order.totalCents), true)}${row(t.vat, m(order.vatCents))}
</table>`;
}

function paymentBlock(order: OrderInput, s: SiteSettings, locale: string) {
  const t = w(locale);
  const note =
    order.paymentMethod === "COD"
      ? t.codNote
      : t.bankNote
          .replace("{amount}", formatMoney(order.totalCents, locale as Locale))
          .replace("{iban}", s.bankIban)
          .replace("{bank}", s.bankName)
          .replace("{number}", order.number);
  return `<div style="margin-top:20px;padding:16px;border-radius:14px;background:#f5f5f7;font-size:13px;line-height:1.5">
<b>${t.payment}: ${order.paymentMethod === "COD" ? t.cod : t.bank}</b><br>${esc(note)}<br><br>
<b>${t.delivery}:</b> ${esc(order.name)}, ${esc(order.address)}, ${esc(order.postcode)} ${esc(order.city)} · ${esc(order.phone)}</div>`;
}

/** Order confirmation: the customer's digital receipt for the order (not a fiscal receipt). */
export function orderConfirmationEmail(order: OrderInput, s: SiteSettings, placedAt: Date) {
  const t = w(order.locale);
  const html = shell(
    `<p style="margin:0;font-size:13px;color:${mute}">${esc(s.companyName)}</p>
<h1 style="margin:6px 0 0;font-size:26px;letter-spacing:-.02em">${t.confirmTitle}</h1>
<p style="margin:10px 0 0;font-size:15px;line-height:1.5">${t.hello}, ${esc(order.name)}. ${t.confirmLead}</p>
<p style="margin:16px 0 0;font-size:13px;color:${mute}">${t.order} <b style="color:${ink}">${esc(order.number)}</b> · ${t.date} ${esc(placedAt.toLocaleDateString("bg-BG", { timeZone: "Europe/Sofia" }))}</p>
${itemsTable(order, order.locale)}${paymentBlock(order, s, order.locale)}
<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${mute}">${t.notReceipt} ${t.withdraw}</p>
<p style="margin:12px 0 0;font-size:13px">${t.questions} ${esc(s.phone)}.</p>`,
    sellerFooter(s),
  );
  return { subject: `${s.companyName}: ${t.order.toLowerCase()} ${order.number}`, html };
}

/** Short message when the admin changes an order's status. */
export function statusEmail(order: OrderInput & { trackingNumber?: string }, status: string, s: SiteSettings) {
  const t = w(order.locale);
  const text = t.status[status];
  if (!text) return null;
  const html = shell(
    `<p style="margin:0;font-size:13px;color:${mute}">${esc(s.companyName)} · ${t.order} ${esc(order.number)}</p>
<h1 style="margin:6px 0 0;font-size:24px;letter-spacing:-.02em">${t.statusTitle}</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:1.5">${t.hello}, ${esc(order.name)}. ${text}</p>
${order.trackingNumber && status === "SHIPPED" ? `<p style="margin:14px 0 0;font-size:15px">${t.tracking}: <b>${esc(order.trackingNumber)}</b></p>` : ""}
${itemsTable(order, order.locale)}
<p style="margin:20px 0 0;font-size:13px">${t.questions} ${esc(s.phone)}.</p>`,
    sellerFooter(s),
  );
  return { subject: `${s.companyName}: ${t.order.toLowerCase()} ${order.number}`, html };
}

/** Notice to the shop that a new order came in. */
export function ownerNoticeEmail(order: OrderInput, s: SiteSettings) {
  const html = shell(
    `<h1 style="margin:0;font-size:22px">Нова поръчка ${esc(order.number)}</h1>
<p style="margin:8px 0 0;font-size:14px">${esc(order.name)} · ${esc(order.phone)} · ${esc(order.email)}</p>
${itemsTable(order, "bg")}${paymentBlock(order, s, "bg")}
${order.note ? `<p style="margin:16px 0 0;font-size:13px"><b>Бележка:</b> ${esc(order.note)}</p>` : ""}
<p style="margin:16px 0 0;font-size:13px">Отворете Админ → Поръчки, за да я потвърдите.</p>`,
    "SmartHomeKJ Admin",
  );
  return { subject: `Нова поръчка ${order.number} · ${formatMoney(order.totalCents)}`, html };
}

// ---------- Invoice / credit note (always in Bulgarian, as ЗДДС requires) ----------

function partyBlock(title: string, p: { name: string; eik: string; vatNumber: string; address: string; mol: string }, extra = "") {
  const field = (label: string, v: string) => (v ? `<div><span style="color:${mute}">${label}:</span> ${esc(v)}</div>` : "");
  return `<td style="width:50%;padding:14px;vertical-align:top;font-size:12.5px;line-height:1.55;border:1px solid ${line};border-radius:12px">
<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${mute};margin-bottom:4px">${title}</div>
<div style="font-size:14px;font-weight:600">${esc(p.name)}</div>${field("ЕИК", p.eik)}${field("ДДС №", p.vatNumber)}${field("Адрес", p.address)}${field("МОЛ", p.mol)}${extra}</td>`;
}

export function invoiceBody(inv: InvoiceDoc) {
  const m = (c: number) => formatMoney(c);
  const title = inv.type === "INVOICE" ? "Фактура" : "Кредитно известие";
  const lines = inv.lines
    .map(
      (l, i) =>
        `<tr>${cell(String(i + 1), `color:${mute}`)}${cell(`${esc(l.name)}${l.sku ? `<div style="font-size:11px;color:${mute}">${esc(l.sku)}</div>` : ""}`)}${cell("бр.", "text-align:center")}${cell(String(l.quantity), "text-align:center")}${cell(m(l.unitNetCents), "text-align:right;white-space:nowrap")}${cell(m(l.netCents), "text-align:right;white-space:nowrap")}</tr>`,
    )
    .join("");
  const bankLine = inv.paymentMethod === "BANK" && inv.seller.iban ? `<div><span style="color:${mute}">IBAN:</span> ${esc(inv.seller.iban)} ${esc(inv.seller.bank)}</div>` : "";
  return `<table role="presentation" style="width:100%;border-collapse:collapse"><tr>
<td style="vertical-align:top"><div style="font-size:28px;font-weight:700;letter-spacing:-.02em">${title}</div>
<div style="margin-top:2px;font-size:12px;font-weight:600;letter-spacing:.08em;color:${mute}">ОРИГИНАЛ</div></td>
<td style="vertical-align:top;text-align:right;font-size:13px;line-height:1.6">
<div>№ <b style="font-size:16px">${esc(inv.number)}</b></div>
<div><span style="color:${mute}">Дата на издаване:</span> ${formatBgDate(inv.issueDate)}</div>
<div><span style="color:${mute}">Дата на данъчното събитие:</span> ${formatBgDate(inv.taxEventDate)}</div>
${inv.place ? `<div><span style="color:${mute}">Място:</span> ${esc(inv.place)}</div>` : ""}
</td></tr></table>
${inv.type === "CREDIT_NOTE" ? `<p style="margin:14px 0 0;font-size:13px">Към фактура № <b>${esc(inv.relatedNumber)}</b>${inv.reason ? ` · Основание: ${esc(inv.reason)}` : ""}</p>` : ""}
<table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 0;margin-top:20px"><tr>
${partyBlock("Доставчик", inv.seller, bankLine)}<td style="width:12px;min-width:12px;font-size:1px">&nbsp;</td>${partyBlock("Получател", inv.buyer)}
</tr></table>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:22px">
<tr>${head("№")}${head("Стока / услуга")}${head("Мярка", "text-align:center")}${head("Кол.", "text-align:center")}${head("Ед. цена", "text-align:right")}${head("Стойност", "text-align:right")}</tr>
${lines}</table>
<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:14px"><tr><td style="width:45%"></td><td>
<table role="presentation" style="width:100%;border-collapse:collapse">
${row("Данъчна основа", m(inv.baseCents))}${row(`ДДС ${inv.vatRate}%`, m(inv.vatCents))}${row("Сума за плащане", m(inv.totalCents), true)}
</table></td></tr></table>
<p style="margin:10px 0 0;font-size:12.5px"><span style="color:${mute}">Словом:</span> ${esc(amountInWordsBg(inv.totalCents))}</p>
${inv.vatNote ? `<p style="margin:6px 0 0;font-size:12.5px">${esc(inv.vatNote)}</p>` : ""}
<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;font-size:12.5px;line-height:1.6"><tr>
<td style="vertical-align:top"><span style="color:${mute}">Начин на плащане:</span> ${inv.paymentMethod === "BANK" ? "Банков превод" : "Наложен платеж"}<br>
<span style="color:${mute}">Към поръчка:</span> ${esc(inv.orderNumber)}</td>
<td style="vertical-align:top;text-align:right">${inv.compiledBy ? `<span style="color:${mute}">Съставил:</span> ${esc(inv.compiledBy)}` : ""}</td>
</tr></table>
<p style="margin:18px 0 0;font-size:11px;color:${mute}">Документът е издаден електронно. Подписът и печатът не са задължителни реквизити (чл. 114, ал. 6 от ЗДДС).</p>`;
}

/** Invoice email: a short note in the customer's language, then the invoice itself in Bulgarian. */
export function invoiceEmail(inv: InvoiceDoc, s: SiteSettings, customerName: string) {
  const t = w(inv.locale);
  const credit = inv.type === "CREDIT_NOTE";
  const html = shell(
    `<p style="margin:0 0 6px;font-size:15px;line-height:1.5">${t.hello}, ${esc(customerName)}. ${credit ? t.creditLead : t.invoiceLead}</p>
<div style="margin-top:18px;padding-top:22px;border-top:1px solid ${line}">${invoiceBody(inv)}</div>`,
    sellerFooter(s),
  );
  const what = credit ? "Кредитно известие" : "Фактура";
  return { subject: `${s.companyName}: ${what} № ${inv.number} (${t.order.toLowerCase()} ${inv.orderNumber})`, html };
}
