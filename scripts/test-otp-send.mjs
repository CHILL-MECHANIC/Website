// Smoke check for the OTP send predicate. The old version compared the vendor body
// to the exact string 'Message Sent Successfully!', so any rewording silently failed
// every OTP. Run: node scripts/test-otp-send.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const src = readFileSync(new URL('../api/auth.ts', import.meta.url), 'utf8');
const start = src.indexOf('export const smsAccepted');
const end = src.indexOf('// Send OTP via SMS');
const { outputText } = ts.transpileModule(src.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
});
const { smsAccepted } = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

// Documented vendor success body.
assert.equal(smsAccepted(200, { message: 'Message Sent Successfully!', data: [{}], error: null }), true);
// The regression: a 2xx the vendor worded differently is still a send.
assert.equal(smsAccepted(200, { message: 'Queued', data: [{}] }), true);
assert.equal(smsAccepted(202, {}), true);

// Real failures must stay failures.
assert.equal(smsAccepted(200, { error: 'invalid sender id' }), false);
assert.equal(smsAccepted(401, { message: 'Message Sent Successfully!' }), false);
assert.equal(smsAccepted(500, {}), false);

console.log('ok');
