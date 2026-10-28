import { VAT_RATE } from "./money";
import type { SiteSettings } from "./settings";
import type { OrderDoc } from "./store";

// Bulgarian tax documents (ЗДДС чл. 114): one sequence of 10-digit numbers shared by invoices and credit notes,
// seller and buyer details, tax base, VAT rate and amount, date of issue and of the tax event.
// A document is never edited or deleted once issued; a mistake is corrected with a credit note.

export type InvoiceType = "INVOICE" | "CREDIT_NOTE";

export type Party = { name: string; eik: string; vatNumber: string; address: string; mol: string };

export type InvoiceLine = { name: string; sku: string; quantity: number; unitNetCents: number; netCents: number };

export type InvoiceDoc = {
  type: InvoiceType;
  number: string;
  seq: number;
  issueDate: string;
  taxEventDate: string;
  place: string;
  orderId: string;
  orderNumber: string;
  email: string;
  locale: string;
  seller: Party & { iban: string; bank: string };
  buyer: Party & { isCompany: boolean };
  lines: InvoiceLine[];
  baseCents: number;
  vatRate: number;
  vatCents: number;
  totalCents: number;
  vatNote: string;
  paymentMethod: string;
  compiledBy: string;
  /** Credit notes: the invoice they correct and why. */
  relatedNumber?: string;
  reason?: string;
  sentAt?: string;
};

export const invoiceNumber = (seq: number) => String(seq).padStart(10, "0");

export const NOT_VAT_REGISTERED_NOTE = "Основание за неначисляване на ДДС: чл. 113, ал. 9 от ЗДДС (лицето не е регистрирано по ЗДДС)";

/** Today in Sofia as YYYY-MM-DD. */
export function sofiaDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(d);
}

export function formatBgDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Buyer details as the order gave them; the admin can correct them before issuing. */
export function buyerFromOrder(order: OrderDoc): Party & { isCompany: boolean } {
  const vat = order.vatNumber.replace(/\s/g, "").toUpperCase();
  const isCompany = Boolean(order.companyName);
  return {
    isCompany,
    name: order.companyName || order.name,
    // "BG123456789" is a VAT number; the digits alone are also the EIK.
    eik: vat.replace(/^BG/, ""),
    vatNumber: /^BG\d{9,10}$/.test(vat) ? vat : "",
    address: `${order.address}, ${order.postcode} ${order.city}`,
    mol: isCompany ? order.name : "",
  };
}

/** Lines and totals for an order. Shop prices include VAT, so net prices are worked out from them. */
export function amountsFor(order: OrderDoc, vatRegistered: boolean) {
  const rate = vatRegistered ? VAT_RATE : 0;
  const net = (gross: number) => Math.round(gross / (1 + rate));
  const lines: InvoiceLine[] = order.items.map((i) => ({
    name: i.name,
    sku: i.sku,
    quantity: i.quantity,
    unitNetCents: net(i.priceCents),
    netCents: net(i.priceCents * i.quantity),
  }));
  if (order.shippingCents > 0) {
    lines.push({ name: "Доставка", sku: "", quantity: 1, unitNetCents: net(order.shippingCents), netCents: net(order.shippingCents) });
  }
  // The base is the sum of the lines, so the document adds up; VAT is what remains of the gross total.
  const baseCents = lines.reduce((sum, l) => sum + l.netCents, 0);
  return { lines, vatRate: rate * 100, vatCents: order.totalCents - baseCents, baseCents, totalCents: order.totalCents };
}

export function sellerFrom(s: SiteSettings): InvoiceDoc["seller"] {
  return {
    name: s.legalName,
    eik: s.eik,
    vatNumber: s.vatRegistered ? s.vatNumber : "",
    address: `${s.address}, ${s.city}`,
    mol: s.manager,
    iban: s.bankIban,
    bank: s.bankName,
  };
}

/** Company fields still holding the [placeholder] text; invoices must not go out with them. */
export function missingSellerFields(s: SiteSettings) {
  const fields: [keyof SiteSettings, string][] = [
    ["legalName", "Регистрирано наименование"],
    ["eik", "ЕИК"],
    ["address", "Адрес"],
    ["city", "Град"],
    ["manager", "Управител"],
  ];
  if (s.vatRegistered) fields.push(["vatNumber", "ДДС номер"]);
  return fields.filter(([k]) => !String(s[k] ?? "").trim() || String(s[k]).includes("[")).map(([, label]) => label);
}

// ---------- Amount in words (Bulgarian), e.g. "сто двадесет и пет евро и 50 цента" ----------

const ONES = {
  m: ["", "един", "два", "три", "четири", "пет", "шест", "седем", "осем", "девет"],
  f: ["", "една", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет"],
  n: ["", "едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет"],
};
const TEENS = ["десет", "единадесет", "дванадесет", "тринадесет", "четиринадесет", "петнадесет", "шестнадесет", "седемнадесет", "осемнадесет", "деветнадесет"];
const TENS = ["", "", "двадесет", "тридесет", "четиридесет", "петдесет", "шестдесет", "седемдесет", "осемдесет", "деветдесет"];
const HUNDREDS = ["", "сто", "двеста", "триста", "четиристотин", "петстотин", "шестстотин", "седемстотин", "осемстотин", "деветстотин"];

/** Words of a number below 1000, as separate parts so "и" can go before the last one. */
function chunk(n: number, gender: "m" | "f" | "n") {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    if (rest >= 20) parts.push(TENS[Math.floor(rest / 10)]);
    if (rest % 10) parts.push(ONES[gender][rest % 10]);
  }
  return parts;
}

const joinParts = (parts: string[]) => (parts.length > 1 ? `${parts.slice(0, -1).join(" ")} и ${parts[parts.length - 1]}` : parts.join(""));

export function numberToWordsBg(n: number, gender: "m" | "f" | "n" = "m"): string {
  if (n === 0) return "нула";
  const groups: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions) groups.push(millions === 1 ? "един милион" : `${joinParts(chunk(millions, "m"))} милиона`);
  if (thousands) groups.push(thousands === 1 ? "хиляда" : `${joinParts(chunk(thousands, "f"))} хиляди`);
  if (rest) {
    const parts = chunk(rest, gender);
    // "хиляда и двеста", but "хиляда двеста и петдесет".
    groups.push(groups.length && parts.length === 1 ? `и ${parts[0]}` : joinParts(parts));
  }
  return groups.join(" ");
}

export function amountInWordsBg(cents: number) {
  const euros = Math.floor(Math.abs(cents) / 100);
  const c = Math.abs(cents) % 100;
  const words = `${numberToWordsBg(euros, "n")} евро`;
  return c ? `${words} и ${c} ${c === 1 ? "цент" : "цента"}` : words;
}
