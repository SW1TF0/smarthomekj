// Black Friday 2026: dates and the discount per shop category.
// Every `null` is shown on the site as a clearly marked yellow placeholder ([ОТСТЪПКА] / [DISCOUNT]),
// so nothing goes live with made-up numbers. Fill them in (e.g. "-20%") before publishing.

/** The countdown runs to `start`; between `start` and `end` the offers are on; after `end` the banner hides itself. */
export const blackFriday = {
  start: "2026-11-27T00:00:00+02:00",
  // TODO(owner): when does the promotion end? Until then: the end of Friday 27.11.
  end: "2026-11-27T23:59:59+02:00",
  /** Shop categories (keys of dict.shop.categories) and their discount, e.g. "-15%". null = not given yet. */
  offers: [
    { category: "lighting", discount: null },
    { category: "climate", discount: null },
    { category: "security", discount: null },
    { category: "energy", discount: null },
    { category: "entertainment", discount: null },
    { category: "hubs", discount: null },
  ] as { category: string; discount: string | null }[],
  /** Extra conditions (one line). null = placeholder. */
  terms: null as string | null,
};

export type PromoPhase = "before" | "live" | "ended";

export function promoPhase(now: number = Date.now()): PromoPhase {
  if (now < Date.parse(blackFriday.start)) return "before";
  if (now <= Date.parse(blackFriday.end)) return "live";
  return "ended";
}
