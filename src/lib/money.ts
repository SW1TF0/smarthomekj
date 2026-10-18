import type { Locale } from "@/i18n/config";

// Bulgaria uses the euro since 1 January 2026. Prices are stored gross (VAT included).
export const VAT_RATE = 0.2;

const intl: Record<Locale, string> = { bg: "bg-BG", en: "en-IE", tr: "tr-TR" };

export function formatMoney(cents: number, locale: Locale = "bg") {
  return new Intl.NumberFormat(intl[locale], { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** VAT portion contained in a gross amount. */
export function vatFromGross(grossCents: number) {
  return Math.round(grossCents - grossCents / (1 + VAT_RATE));
}

export function formatDate(date: Date | string, locale: Locale = "bg") {
  return new Intl.DateTimeFormat(intl[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Sofia" }).format(new Date(date));
}
