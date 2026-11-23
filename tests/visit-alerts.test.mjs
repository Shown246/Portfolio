import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { projects } from '../src/data/projects.ts';
import { after, beforeEach, mock, test } from 'node:test';
import {
  alertsEnabled, buildVisitEmail, parseVisit, visitorHash, RESERVE_VISIT, FINISH_VISIT,
} from '../src/lib/visit-alerts.ts';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/lib/visit-alerts') {
      return { url: new URL('../src/lib/visit-alerts.ts', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '@/data/projects') {
      return { url: new URL('../src/data/projects.ts', import.meta.url).href, shortCircuit: true };
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

test('project opens use the canonical title and a separate cooldown but share the daily quota', async () => {
  const body = { ...event(), eventType: 'project_open', projectId: projects[0].id, projectTitle: 'Forged title' };
  assert.equal((await POST(request(body))).status, 200);
  assert.equal(sends[0].payload.subject, `Project opened: ${projects[0].title}`);
  assert.ok(sends[0].payload.text.includes('Opened project details'));
  assert.ok(!sends[0].payload.text.includes('Forged title'));
  const projectReservation = storeCalls[0];
  assert.ok(projectReservation.keys[3].endsWith(`:project:${projects[0].id}`));
  assert.equal(projectReservation.args[3], 20);
  await POST(request(event()));
  const visitReservation = storeCalls[2];
  assert.notEqual(projectReservation.keys[3], visitReservation.keys[3]);
  assert.equal(projectReservation.keys[5], visitReservation.keys[5]);
  assert.equal(visitReservation.args[3], 5);
});

test('unknown projects and unsupported actions are rejected before touching Redis', async () => {
  for (const extra of [
    { eventType: 'project_open', projectId: 'not-a-real-project' },
    { eventType: 'project_open' }, { eventType: 'github_click', projectId: projects[0].id },
    { projectId: projects[0].id },
  ]) assert.equal((await POST(request({ ...event(), ...extra }))).status, 400);
  assert.equal(storeCalls.length, 0);
  assert.equal(sends.length, 0);
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
    dispatchEvent: event => { listeners.get(event.type)?.(event); return true; },
  };
  const context = {
    exports, require: () => ({ useEffect: fn => effects.push(fn) }), document, window,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    URL, crypto: { randomUUID }, AbortSignal, CustomEvent,
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true }; },
  };
  runInNewContext(trackerCode, context);
  exports.default({ enabled });
  effects.forEach(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  return { calls, storage, document, listeners, window, openProject: exports.trackProjectOpen };
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

test('project alerts have per-project cooldowns independent of the page visit', async () => {
  const browser = await mountTracker();
  browser.openProject(projects[0].id);
  browser.openProject(projects[0].id); // Rapid double-click while the first request is pending.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(browser.calls.length, 2);
  assert.equal(browser.calls[1].body.eventType, 'project_open');
  assert.equal(browser.calls[1].body.projectId, projects[0].id);
  assert.equal(browser.calls[1].body.browserId, browser.calls[0].body.browserId);
  browser.openProject(projects[0].id);
  browser.openProject(projects[1].id);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(browser.calls.length, 3);
  const refreshed = await mountTracker({ storage: browser.storage });
  refreshed.openProject(projects[0].id);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(refreshed.calls.length, 0);
  const key = `portfolio:visit-alert:v1:project:${projects[0].id}`;
  const state = JSON.parse(browser.storage.get(key));
  state.visitedAt -= 31 * 60_000;
  browser.storage.set(key, JSON.stringify(state));
  refreshed.openProject(projects[0].id);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(refreshed.calls.length, 1);
});

test('browser opt-out and disabled deployments also suppress project opens', async () => {
  for (const options of [{ enabled: false }, { href: 'https://portfolio.example/?visit-alerts=off' }]) {
    const browser = await mountTracker(options);
    browser.openProject(projects[0].id);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(browser.calls.length, 0);
  }
});

test('only the card-open handler tracks interest; modal controls and outgoing links do not', () => {
  const code = ts.transpileModule(
    readFileSync(new URL('../src/components/ProjectsSection.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  let open = null;
  let hookIndex = 0;
  const tracked = [];
  const exports = {};
  const jsx = (type, props, key) => ({ type, props, key });
  runInNewContext(code, {
    exports,
    require: name => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useEffect() {}, useState: () => hookIndex++ === 0 ? [open, value => { open = value; }] : [false, () => {}],
      };
      if (name === '@/data/projects') return { projects };
      if (name === '@/components/VisitTracker') return { trackProjectOpen: id => tracked.push(id) };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  function elements(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
  }
  let tree = elements(exports.default());
  tree.find(node => node.type === 'button' && node.key === projects[0].id).props.onClick();
  assert.equal(open.id, projects[0].id);
  assert.deepEqual(tracked, [projects[0].id]);
  hookIndex = 0;
  tree = elements(exports.default());
  const links = tree.filter(node => node.type === 'a');
  assert.ok(links.length > 0);
  assert.ok(links.every(node => !node.props.onClick));
  tree.find(node => node.props?.['aria-label'] === 'close').props.onClick();
  tree.find(node => node.type === 'button' && !node.key && !node.props['aria-label']).props.onClick();
  assert.deepEqual(tracked, [projects[0].id]);
});
