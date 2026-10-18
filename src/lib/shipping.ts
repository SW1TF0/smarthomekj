export type ShippingRules = { shippingCents: number; freeShippingFromCents: number };

export function shippingFor(subtotalCents: number, rules: ShippingRules) {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= rules.freeShippingFromCents ? 0 : rules.shippingCents;
}
