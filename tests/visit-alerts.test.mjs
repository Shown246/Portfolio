import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { after, beforeEach, mock, test } from 'node:test';
import {
  alertsEnabled, buildVisitEmail, parseVisit, visitorHash, RESERVE_VISIT, FINISH_VISIT,
} from '../src/lib/visit-alerts.ts';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/lib/visit-alerts') {
      return { url: new URL('../src/lib/visit-alerts.ts', import.meta.url).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const originalEnv = { ...process.env };
let reservations;
let storeCalls;
let sends;
let sendError;
let storeError;
mock.module('@upstash/redis', {
  namedExports: { Redis: class {
    async eval(script, keys, args) {
      storeCalls.push({ script, keys, args });
      if (storeError) throw new Error('Store offline');
      if (script === FINISH_VISIT) return 1;
      assert.equal(script, RESERVE_VISIT);
      return reservations.shift() || ['send', args[1]];
    }
  } },
});
mock.module('resend', {
  namedExports: { Resend: class {
    emails = { send: async (payload, options) => {
      sends.push({ payload, options });
      return sendError ? { error: { message: 'Provider unavailable' } } : { data: { id: 'email-test' } };
    } };
  } },
});
const { POST } = await import('../src/app/api/visit/route.ts');
const event = () => ({
  browserId: '84231228-c236-4e61-a654-456d077a4061',
  eventId: '145bce73-e28c-456a-baf2-6f5262fcb886', visitedAt: Date.now(),
  path: '/projects?token=private#secret',
  referrer: 'https://linkedin.com/path?private=yes',
});
function request(body = event(), headers = {}) {
  return new Request('https://portfolio.example/api/visit', {
    method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      origin: 'https://portfolio.example', 'content-type': 'application/json',
      'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 Chrome/131.0 Safari/537.36',
      'x-vercel-forwarded-for': '192.0.2.1', 'x-vercel-ip-country': 'BD', ...headers,
    },
  });
}
beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production', VISIT_ALERTS_ENABLED: 'true',
    VISIT_ALERT_SITE_URL: 'https://portfolio.example', VISIT_ALERT_EMAIL: 'owner@example.com',
    RESEND_API_KEY: 'fake-test-key', UPSTASH_REDIS_REST_URL: 'https://redis.example',
    UPSTASH_REDIS_REST_TOKEN: 'fake-token', VISIT_ALERT_HASH_SECRET: 'a'.repeat(64),
    VISIT_ALERT_DAILY_CAP: '50',
  });
  reservations = []; storeCalls = []; sends = []; sendError = false; storeError = false;
});
after(() => { process.env = originalEnv; });

test('only explicitly enabled Vercel production can report visits', async () => {
  for (const overrides of [
    { VERCEL_ENV: 'preview' }, { VERCEL: undefined },
    { NODE_ENV: 'development' }, { VISIT_ALERTS_ENABLED: 'false' },
  ]) assert.equal(alertsEnabled({ ...process.env, ...overrides }), false);
  process.env.VERCEL_ENV = 'preview';
  assert.equal((await POST(request())).status, 200);
  assert.equal(storeCalls.length, 0);
  assert.equal(sends.length, 0);
});

test('missing configuration fails closed', async () => {
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  assert.equal((await POST(request())).status, 503);
  assert.equal(sends.length, 0);
});

test('wrong origins, bots, malformed and oversized bodies do not send email', async () => {
  assert.equal((await POST(request(event(), { origin: 'https://attacker.example' }))).status, 403);
  assert.equal((await POST(request(event(), { 'sec-fetch-site': 'cross-site' }))).status, 403);
  assert.equal((await (await POST(request(event(), { 'user-agent': 'Googlebot' }))).json()).status, 'ignored');
  assert.equal((await POST(request('{invalid'))).status, 400);
  assert.equal((await POST(request({ ...event(), browserId: 'fake' }))).status, 400);
  assert.equal((await POST(request('x'.repeat(4097)))).status, 413);
  assert.equal(sends.length, 0);
  assert.equal(storeCalls.length, 0);
});

test('validation rejects stale events and strips private URL components', () => {
  assert.equal(parseVisit({ ...event(), visitedAt: Date.now() - 11 * 60_000 }), null);
  assert.equal(parseVisit({ ...event(), path: '//attacker.example' }), null);
  assert.equal(parseVisit({ ...event(), referrer: 'javascript:alert(1)' }), null);
  const visit = parseVisit(event());
  assert.equal(visit.path, '/projects');
  assert.equal(visit.referrer, 'linkedin.com');
});

test('email escapes untrusted paths and only includes approved metadata', () => {
  const visit = parseVisit({ ...event(), path: '/<img src=x onerror=alert(1)>' });
  const email = buildVisitEmail(visit, 'Mozilla iPhone Mobile Safari/123', 'BD');
  assert.ok(!email.html.includes('<img'));
  assert.ok(email.html.includes('&lt;img'));
  assert.ok(email.text.includes('Mobile'));
  assert.ok(email.text.includes('Asia/Dhaka'));
  assert.ok(!email.text.includes('private'));
});

test('successful reservation sends to the configured owner and confirms it', async () => {
  assert.equal((await (await POST(request())).json()).status, 'sent');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].payload.to, 'owner@example.com');
  assert.match(sends[0].options.idempotencyKey, /^portfolio-visit\/[a-f0-9]{64}$/);
  assert.equal(storeCalls[1].args[1], 'sent');
  assert.ok(!JSON.stringify(storeCalls).includes('192.0.2.1'));
  assert.ok(!JSON.stringify(sends).includes('private'));
});

test('duplicate, limited, and concurrent requests do not send', async () => {
  for (const [status, code] of [['duplicate', 200], ['limited', 200], ['busy', 503]]) {
    reservations.push([status]);
    assert.equal((await POST(request())).status, code);
  }
  assert.equal(sends.length, 0);
});

test('retry uses the original payload and same provider idempotency key', async () => {
  const body = event();
  sendError = true;
  assert.equal((await POST(request(body))).status, 503);
  assert.equal(storeCalls.at(-1).args[1], 'retry');
  const storedPayload = storeCalls[0].args[1];
  reservations.push(['send', storedPayload]);
  process.env.VISIT_ALERT_EMAIL = 'changed@example.com';
  sendError = false;
  assert.equal((await POST(request(body))).status, 200);
  assert.deepEqual(sends[0], sends[1]);
});

test('store outage prevents email and hashes rotate daily', async () => {
  storeError = true;
  assert.equal((await POST(request())).status, 503);
  assert.equal(sends.length, 0);
  assert.notEqual(visitorHash('192.0.2.1', 'secret', '2026-11-23'), visitorHash('192.0.2.1', 'secret', '2026-11-24'));
});

// Execute the actual client component with browser surfaces, without mounting a UI.
const trackerCode = ts.transpileModule(
  readFileSync(new URL('../src/components/VisitTracker.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
async function mountTracker({ enabled = true, href = 'https://portfolio.example/', storage = new Map(), visible = true } = {}) {
  const effects = [];
  const calls = [];
  const listeners = new Map();
  const exports = {};
  const document = {
    visibilityState: visible ? 'visible' : 'hidden', referrer: 'https://linkedin.com/?secret=hidden',
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {},
  };
  const window = {
    location: new URL(href),
    history: { state: {}, replaceState: (_state, _title, url) => { window.location = new URL(url); } },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {},
    setTimeout: (fn) => { fn(); },
  };
  const context = {
    exports, require: () => ({ useEffect: fn => effects.push(fn) }), document, window,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    URL, crypto: { randomUUID }, AbortSignal,
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true }; },
  };
  runInNewContext(trackerCode, context);
  exports.default({ enabled });
  effects.forEach(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  return { calls, storage, document, listeners, window };
}

test('tracker ignores disabled deployments and waits for a visible page', async () => {
  assert.equal((await mountTracker({ enabled: false })).calls.length, 0);
  const browser = await mountTracker({ visible: false });
  assert.equal(browser.calls.length, 0);
  browser.document.visibilityState = 'visible';
  browser.listeners.get('visibilitychange')();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(browser.calls.length, 1);
});

test('browser opt-out survives reload and can be reversed', async () => {
  const browser = await mountTracker({ href: 'https://portfolio.example/?visit-alerts=off' });
  assert.equal(browser.calls.length, 0);
  assert.equal(browser.window.location.search, '');
  assert.equal((await mountTracker({ storage: browser.storage })).calls.length, 0);
  const enabled = await mountTracker({ storage: browser.storage, href: 'https://portfolio.example/?visit-alerts=on' });
  assert.equal(enabled.calls.length, 1);
});

test('refresh suppresses a second email and a later visit creates a new event', async () => {
  const first = await mountTracker();
  assert.equal(first.calls.length, 1);
  assert.equal(first.calls[0].body.referrer, 'https://linkedin.com');
  const refreshed = await mountTracker({ storage: first.storage });
  assert.equal(refreshed.calls.length, 0);
  const key = 'portfolio:visit-alert:v1';
  const state = JSON.parse(first.storage.get(key));
  state.visitedAt -= 31 * 60_000;
  first.storage.set(key, JSON.stringify(state));
  const returned = await mountTracker({ storage: first.storage });
  assert.equal(returned.calls.length, 1);
  assert.equal(returned.calls[0].body.browserId, first.calls[0].body.browserId);
  assert.notEqual(returned.calls[0].body.eventId, first.calls[0].body.eventId);
});
