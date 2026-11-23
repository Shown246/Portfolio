// Opt-in integration check: uses only isolated, synthetic Redis keys. No emails.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { RESERVE_VISIT, FINISH_VISIT } from '../src/lib/visit-alerts.ts';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN,
  automaticDeserialization: false, retry: false, signal: () => AbortSignal.timeout(5000),
});
const prefix = `portfolio-visits:verification:${randomUUID()}:`;
const keys = new Set();
function event(name, browser = name, scope = '') {
  const result = ['payload', 'sent', 'lock'].map(suffix => `${prefix}${name}:${suffix}`);
  result.push(`${prefix}browser:${browser}${scope}`, `${prefix}ip${scope ? ':project' : ''}`, `${prefix}day`);
  result.forEach(key => keys.add(key));
  return result;
}
async function reserve(eventKeys, owner = 'owner', cap = 50, ipLimit = 5) {
  return redis.eval(RESERVE_VISIT, eventKeys, [owner, '{"synthetic":true}', cap, ipLimit]);
}
try {
  assert.equal(await redis.ping(), 'PONG');
  const first = event('first');
  assert.deepEqual(await reserve(first), ['send', '{"synthetic":true}']);
  assert.deepEqual(await reserve(first), ['busy']);
  await redis.eval(FINISH_VISIT, [first[2], first[1]], ['wrong-owner', 'retry']);
  assert.deepEqual(await reserve(first), ['busy']);
  await redis.eval(FINISH_VISIT, [first[2], first[1]], ['owner', 'retry']);
  assert.deepEqual(await reserve(first), ['send', '{"synthetic":true}']);
  await redis.eval(FINISH_VISIT, [first[2], first[1]], ['owner', 'sent']);
  assert.deepEqual(await reserve(first), ['duplicate']);
  assert.deepEqual(await reserve(event('second', 'first')), ['duplicate']);
  assert.deepEqual(await reserve(event('daily-cap'), 'owner', 1), ['limited']);
  const concurrent = event('concurrent');
  const attempts = await Promise.all(Array.from({ length: 4 }, (_, i) => reserve(concurrent, `owner-${i}`)));
  assert.equal(attempts.filter(([status]) => status === 'send').length, 1);
  assert.equal(attempts.filter(([status]) => status === 'busy').length, 3);
  for (let i = 0; i < 3; i++) assert.equal((await reserve(event(`network-${i}`)))[0], 'send');
  assert.deepEqual(await reserve(event('network-limited')), ['limited']);
  // Project cooldowns are independent of visits and other projects, while the
  // daily budget is shared by both kinds of alert.
  assert.equal((await reserve(event('project-one', 'first', ':project:one'), 'owner', 50, 20))[0], 'send');
  assert.deepEqual(await reserve(event('project-repeat', 'first', ':project:one'), 'owner', 50, 20), ['duplicate']);
  assert.deepEqual(await reserve(event('project-capped', 'first', ':project:two'), 'owner', 1, 20), ['limited']);
  assert.equal((await reserve(event('project-two', 'first', ':project:two'), 'owner', 50, 20))[0], 'send');
  assert.ok(await redis.ttl(first[0]) > 0);
  assert.ok(await redis.ttl(first[3]) > 0);
  console.log('PASS: live Redis connection, atomic reservations, retries, lock ownership, per-project cooldowns, concurrency, IP quotas, shared daily quota and TTLs.');
} finally {
  // Only exact test-owned keys are deleted. No production keys are scanned.
  await redis.del(...keys);
}
