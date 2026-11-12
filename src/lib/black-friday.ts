// Black Friday 2026 (owner's decision, 12.11.2026): −10% on every price in the shop,
// from Friday 13.11.2026 00:00 to Sunday 30.11.2026 23:59 (Sofia time).
// The discount is applied in the browser when the catalogue loads (lib/store.ts loadProducts),
// so it starts and ends on time without a new build; the bag and the order use the same prices.

export const blackFriday = {
  start: "2026-11-13T00:00:00+02:00",
  end: "2026-11-30T23:59:59+02:00",
  percent: 10,
  /** Shop categories shown as tiles on the Black Friday page (keys of dict.shop.categories). */
  categories: ["lighting", "climate", "security", "energy", "cleaning", "hubs"],
};

export type PromoPhase = "before" | "live" | "ended";

export function promoPhase(now: number = Date.now()): PromoPhase {
  if (now < Date.parse(blackFriday.start)) return "before";
  if (now <= Date.parse(blackFriday.end)) return "live";
  return "ended";
}

/** The Black Friday price of a gross price in cents: −percent, rounded DOWN to whole 10 cents
 *  (the shop's prices end in 0), so the discount is never less than the advertised percent. */
export function promoPrice(cents: number) {
  return Math.floor((cents * (100 - blackFriday.percent)) / 100 / 10) * 10;
}

/** Products with the discount applied while the promotion runs: the old price becomes the struck-through one. */
export function withPromo<T extends { priceCents: number; compareAtCents: number | null }>(rows: T[], now: number = Date.now()): T[] {
  if (promoPhase(now) !== "live") return rows;
  return rows.map((p) => ({ ...p, compareAtCents: Math.max(p.priceCents, p.compareAtCents ?? 0), priceCents: promoPrice(p.priceCents) }));
}
