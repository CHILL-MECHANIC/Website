// Bundle definitions and discount math, shared by the cart (via src/data/bundles.ts) and by
// api/booking/create.ts. Pure data and functions only: no imports, so it runs in both places.
//
// The server treats BUNDLE_ITEMS prices as the truth for these ids and ignores the price in the request.
// If a price changes in ServiceDetail.tsx, change it here too. In dev, FrequentBundles checks that they match.

export interface BundleItem {
  name: string;        // same as the name in ServiceDetail.tsx, so cart lines look the same either way
  label: string;       // short name for bundle cards
  description: string;
  price: number;
}

export interface Bundle {
  id: string;
  title: string;
  itemIds: [string, string];
  discountPercent?: number;
  fixedPrice?: number; // price for the pair; used when discountPercent is not set
  badge?: string;
}

export const BUNDLE_ITEMS: Record<string, BundleItem> = {
  'ac-foam-1': { name: 'Foam Power Jet Service-1 AC', label: 'Foam jet service, 1 AC', description: 'Premium foam cleaning and filter cleaning for single AC unit.', price: 599 },
  'ac-gas-refill': { name: 'Gas Refill & Check Up', label: 'AC gas refill', description: 'Gas leak detection, gas refill, and pressure check. Choose from 1, 1.5 & 2 Ton options.', price: 1999 },
  'ac-split-installation': { name: 'Split AC Installation', label: 'Split AC installation', description: 'Complete installation with piping, wiring, and testing.', price: 1499 },
  'ac-not-cooling': { name: 'AC Not Cooling/Less Cooling', label: 'AC cooling check-up', description: 'Diagnose and fix cooling issues and performance problems.', price: 249 },
  'ro-regular-service': { name: 'Water Purifier Regular Service', label: 'RO regular service', description: 'Regular maintenance service with basic filter replacement and system cleaning.', price: 1699 },
  'ro-checkup': { name: 'Check Up - Water Purifier', label: 'RO check-up', description: 'Complete diagnostic check-up of water purifier with TDS testing and system inspection.', price: 249 },
  'geyser-service': { name: 'Geyser Service', label: 'Geyser service', description: 'Complete maintenance service with element check, tank cleaning, and safety inspection.', price: 549 },
  'geyser-checkup': { name: 'Check Up - Geyser', label: 'Geyser check-up', description: 'Complete diagnostic check-up of geyser with heating element and thermostat inspection.', price: 249 },
  'wm-top-load-checkup': { name: 'Checkup - AM Top Load', label: 'Washing machine check-up', description: 'Complete diagnostic check-up for automatic top load washing machines.', price: 249 },
  'fridge-single-door': { name: 'Check Up - Single Door', label: 'Fridge check-up', description: 'Complete diagnostic check-up for single door refrigerators with performance assessment.', price: 249 },
  'microwave-checkup': { name: 'Check Up', label: 'Microwave check-up', description: 'Complete diagnostic check-up of microwave with functionality testing and safety inspection.', price: 249 },
};

export const BUNDLES: Bundle[] = [
  { id: 'ac-foam-gas', title: 'Clean it and refill it', itemIds: ['ac-foam-1', 'ac-gas-refill'], discountPercent: 10, badge: 'Save 10%' },
  { id: 'ac-install-checkup', title: 'Install and check cooling', itemIds: ['ac-split-installation', 'ac-not-cooling'], fixedPrice: 1599 },
  { id: 'ro-service-checkup', title: 'RO service and check-up', itemIds: ['ro-regular-service', 'ro-checkup'], discountPercent: 10, badge: 'Save 10%' },
  { id: 'geyser-service-checkup', title: 'Geyser service and check-up', itemIds: ['geyser-service', 'geyser-checkup'], fixedPrice: 699 },
  { id: 'wm-fridge-checkup', title: 'Washing machine and fridge check-up', itemIds: ['wm-top-load-checkup', 'fridge-single-door'], fixedPrice: 449 },
  { id: 'microwave-fridge-checkup', title: 'Microwave and fridge check-up', itemIds: ['microwave-checkup', 'fridge-single-door'], fixedPrice: 449 },
];

export const getBundle = (id: string | undefined) => BUNDLES.find(b => b.id === id);

/** Original price of one of each item, from the trusted table. */
export const bundleOriginalTotal = (b: Bundle) => b.itemIds.reduce((sum, id) => sum + (BUNDLE_ITEMS[id]?.price ?? 0), 0);

/** Rupees saved when the pair is bought together. Whole rupees, never negative, never more than the pair costs. */
export const bundleSaving = (b: Bundle): number => {
  const original = bundleOriginalTotal(b);
  const saving = b.discountPercent !== undefined
    ? Math.round((original * b.discountPercent) / 100)
    : original - (b.fixedPrice ?? original);
  return Math.max(0, Math.min(original, saving));
};

/**
 * Bundle savings for a set of cart lines. A bundle counts once, and only if BOTH of its lines carry its id.
 * So removing one item, or re-adding it on its own, drops the discount. The cart uses this for display
 * and the server uses it for the real amount, so the two always agree.
 */
export const computeBundleSavings = (lines: { id?: string; bundleId?: string }[]) => {
  const claimed = Array.from(new Set(lines.map(l => l.bundleId).filter(Boolean) as string[]));
  return claimed
    .map(getBundle)
    .filter((b): b is Bundle => !!b && b.itemIds.every(id => lines.some(l => l.id === id && l.bundleId === b.id)))
    .map(b => ({ bundleId: b.id, title: b.title, amount: bundleSaving(b) }));
};
