// Run: node --experimental-strip-types scripts/test-bundles.mjs
import assert from 'node:assert/strict';
import { BUNDLES, BUNDLE_ITEMS, bundleSaving, computeBundleSavings } from '../api/_lib/bundles.ts';

for (const b of BUNDLES) {
  b.itemIds.forEach(id => assert.ok(BUNDLE_ITEMS[id], `${b.id}: unknown item ${id}`));
  const s = bundleSaving(b);
  assert.ok(s > 0, `${b.id}: no saving`);
}
const byId = Object.fromEntries(BUNDLES.map(b => [b.id, b]));
assert.equal(bundleSaving(byId['ac-foam-gas']), 260);        // 10% of 2598
assert.equal(bundleSaving(byId['geyser-service-checkup']), 99); // 798 -> 699
// Both lines must carry the bundle id; one line alone, or a re-added line without it, gets nothing.
const both = [{ id: 'geyser-service', bundleId: 'geyser-service-checkup' }, { id: 'geyser-checkup', bundleId: 'geyser-service-checkup' }];
assert.equal(computeBundleSavings(both)[0].amount, 99);
assert.equal(computeBundleSavings(both.slice(0, 1)).length, 0);
assert.equal(computeBundleSavings([both[0], { id: 'geyser-checkup' }]).length, 0);
assert.equal(computeBundleSavings([{ id: 'x', bundleId: 'made-up' }]).length, 0);
console.log('bundles ok');
