// Coupon codes, shared by the cart (via src/data/coupons.ts) and api/booking/create.ts.
// Pure data and functions, no imports. The server decides the discount; the client only sends the code.

export const COUPONS: Record<string, { percent: number }> = {
  APP5: { percent: 5 },
  APP10: { percent: 10 },
  APP15: { percent: 15 },
  APP20: { percent: 20 },
  APP25: { percent: 25 },
};

/** "app 10", " APP-10 " and "APP10" are the same code. */
export const normalizeCoupon = (raw: unknown): string => String(raw ?? '').toUpperCase().replace(/[\s-]+/g, '');

export const getCoupon = (raw: unknown) => {
  const code = normalizeCoupon(raw);
  return COUPONS[code] ? { code, ...COUPONS[code] } : null;
};

/**
 * FIRST100: flat ₹100 off, only when an item costs ₹249 (the check-ups), prepaid orders only, once per customer.
 * Kept apart from COUPONS so the cart's percent-code logic is unchanged. api/booking/create.ts enforces the rules.
 */
export const FIRST100 = { code: 'FIRST100', off: 100, price: 249 };
export const first100Discount = (unitPrices: number[], base: number): number =>
  unitPrices.includes(FIRST100.price) ? Math.max(0, Math.min(base, FIRST100.off)) : 0;

/** Rupees off for a code on an amount (items after any bundle saving). Whole rupees; 0 for unknown codes. */
export const couponDiscount = (raw: unknown, base: number): number => {
  const c = getCoupon(raw);
  return c ? Math.max(0, Math.min(base, Math.round((base * c.percent) / 100))) : 0;
};
