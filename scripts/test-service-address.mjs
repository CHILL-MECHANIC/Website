// Smoke check for the Cart address bug: a profile with no address comes back as
// an object of empty strings, which is truthy. Run: node scripts/test-service-address.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const src = readFileSync(new URL('../src/pages/Cart.tsx', import.meta.url), 'utf8');
// Pull just the two exported pure helpers out of the page component.
const start = src.indexOf('export const hasUsableProfileAddress');
const end = src.indexOf('export default function Cart');
const { outputText } = ts.transpileModule(src.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
});
const { hasUsableProfileAddress, buildServiceAddress } = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

const empty = { address: '', city: '', state: '', pincode: '' };
const real = { address: 'C Block', city: 'Bhopal', state: 'MP', pincode: '462003' };
const typed = { flatNo: 'A-101', buildingName: '', streetArea: 'MG Road', landmark: '', pincode: '560001' };
const blank = { flatNo: '', buildingName: '', streetArea: '', landmark: '', pincode: '' };

// The regression: empty profile object must not count as a usable address.
assert.equal(hasUsableProfileAddress(empty), false);
assert.equal(hasUsableProfileAddress(null), false);
assert.equal(hasUsableProfileAddress(real), true);

// With no usable profile address, what the customer typed must survive.
assert.equal(
  buildServiceAddress(false, empty, typed),
  'Flat/Apt: A-101, MG Road, Pincode: 560001'
);
assert.equal(
  buildServiceAddress(true, real, blank),
  'C Block, Bhopal, MP, Pincode: 462003'
);

console.log('ok');
