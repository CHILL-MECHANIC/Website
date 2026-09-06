// Smoke check for canRequestOTP's decision branches, exercised against a stubbed
// supabase query. Covers the two regressions: a failed rate-limit lookup must not
// hand out an unlimited allowance, and a zero wait must not be reported as a wait.
// Run: node scripts/test-otp-ratelimit.mjs
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const srcPath = new URL('../backend/src/services/otpService.ts', import.meta.url);
const src = readFileSync(srcPath, 'utf8');

// Isolate canRequestOTP plus the constants it reads, and stub the supabase import.
const constants = src.slice(src.indexOf('const OTP_VALIDITY_MINUTES'), src.indexOf('/**\n * Generates'));
const fn = src.slice(src.indexOf('export async function canRequestOTP'), src.indexOf('/**\n * Logs OTP to database'));
const stub = `
let __result = { data: [], error: null };
export const __setResult = (r) => { __result = r; };
const supabase = { from: () => { const q = { select: () => q, eq: () => q, gte: () => q,
  order: () => Promise.resolve(__result) }; return q; } };
export function formatPhoneNumber(p) { return '91' + String(p).replace(/\\D/g, '').slice(-10); }
`;
const { outputText } = ts.transpileModule(stub + constants + fn, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
});
const file = join(mkdtempSync(join(tmpdir(), 'otprl-')), 'm.mjs');
writeFileSync(file, outputText);
const { canRequestOTP, __setResult } = await import(pathToFileURL(file).href);

const PHONE = '9876543210';
const ago = (ms) => new Date(Date.now() - ms).toISOString();

// Under the cap -> allowed.
__setResult({ data: [{ created_at: ago(60_000) }], error: null });
assert.equal((await canRequestOTP(PHONE)).canRequest, true);

// At the cap with time left -> refused, with a real positive wait.
__setResult({
  data: [{ created_at: ago(60_000) }, { created_at: ago(30_000) }, { created_at: ago(10_000) }],
  error: null
});
const capped = await canRequestOTP(PHONE);
assert.equal(capped.canRequest, false);
assert.ok(capped.waitTime > 0, 'wait must be positive when the window is still open');

// Regression: at the cap but the oldest row sits on the window boundary. Wait
// computes to <= 0, which must read as "expired", never as a 0-second wait that
// callers then round up to a full window.
__setResult({
  data: [{ created_at: ago(5 * 60 * 1000) }, { created_at: ago(30_000) }, { created_at: ago(10_000) }],
  error: null
});
const boundary = await canRequestOTP(PHONE);
assert.equal(boundary.canRequest, true);
assert.equal(boundary.waitTime, undefined);

// Regression: a failed lookup must fail closed, not hand out an uncapped allowance.
__setResult({ data: null, error: { message: 'connection reset' } });
const broken = await canRequestOTP(PHONE);
assert.equal(broken.canRequest, false);
assert.ok(broken.error, 'must report why, so callers do not quote a fabricated wait');
assert.equal(broken.waitTime, undefined);

console.log('ok');
