import { createHmac } from 'node:crypto';

export const VISIT_WINDOW_MS = 30 * 60 * 1000;
export const MAX_EVENT_AGE_MS = 10 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VisitEvent = {
  eventId: string;
  browserId: string;
  visitedAt: number;
  path: string;
  referrer: string;
};

export function alertsEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.VISIT_ALERTS_ENABLED === 'true' && env.VERCEL === '1' &&
    env.VERCEL_ENV === 'production' && env.NODE_ENV === 'production';
}

export function parseVisit(value: unknown, now = Date.now()): VisitEvent | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.eventId !== 'string' || !UUID.test(v.eventId) ||
      typeof v.browserId !== 'string' || !UUID.test(v.browserId) ||
      typeof v.visitedAt !== 'number' || !Number.isSafeInteger(v.visitedAt) ||
      v.visitedAt > now + 60_000 || now - v.visitedAt > MAX_EVENT_AGE_MS ||
      typeof v.path !== 'string' || v.path.length > 2048 ||
      !v.path.startsWith('/') || v.path.startsWith('//') ||
      /[\\\u0000-\u001f]/.test(v.path) ||
      typeof v.referrer !== 'string' || v.referrer.length > 2048) return null;
  let referrer = '';
  if (v.referrer) {
    try {
      const url = new URL(v.referrer);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      referrer = url.hostname;
    } catch { return null; }
  }
  return {
    eventId: v.eventId, browserId: v.browserId, visitedAt: v.visitedAt,
    path: v.path.split(/[?#]/)[0], referrer,
  };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

export function visitorHash(value: string, secret: string, day: string) {
  return createHmac('sha256', secret).update(`${day}:${value}`).digest('hex');
}

export function describeDevice(ua: string) {
  const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'Tablet' :
    /Mobile|iPhone/i.test(ua) ? 'Mobile' : 'Desktop / unknown';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' :
    /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS\//.test(ua) ? 'Chrome' :
    /Safari\//.test(ua) ? 'Safari' : 'Unknown';
  return { device, browser };
}

export function buildVisitEmail(visit: VisitEvent, ua: string, country: string | null) {
  const { device, browser } = describeDevice(ua);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', dateStyle: 'long', timeStyle: 'medium',
  }).format(new Date(visit.visitedAt));
  const rows = [
    ['Time', `${time} (Asia/Dhaka)`], ['Page', visit.path],
    ['Source', visit.referrer || 'Direct / unknown'], ['Device', device], ['Browser', browser],
  ];
  if (country && /^[A-Z]{2}$/.test(country)) rows.push(['Approximate country', country]);
  return {
    subject: 'New portfolio visit',
    text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
    html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#202020"><h2>New portfolio visit</h2><table>${rows.map(([label, value]) => `<tr><th style="text-align:left;padding:8px">${label}</th><td style="padding:8px">${escapeHtml(value)}</td></tr>`).join('')}</table><p style="color:#666">One alert per browser every 30 minutes. Browser and location details are approximate.</p></div>`,
  };
}

// One atomic reservation prevents races across Vercel instances. Only new events
// consume quotas; retries reuse the original email, including its timestamp.
export const RESERVE_VISIT = `#!lua flags=allow-key-locking
local existing = redis.call('GET', KEYS[1])
if existing then
  if redis.call('EXISTS', KEYS[2]) == 1 then return {'duplicate'} end
  if not redis.call('SET', KEYS[3], ARGV[1], 'NX', 'EX', 45) then return {'busy'} end
  return {'send', existing}
end
if redis.call('EXISTS', KEYS[4]) == 1 then return {'duplicate'} end
if tonumber(redis.call('GET', KEYS[5]) or '0') >= 5 then return {'limited'} end
if tonumber(redis.call('GET', KEYS[6]) or '0') >= tonumber(ARGV[3]) then return {'limited'} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', 86400)
redis.call('SET', KEYS[3], ARGV[1], 'EX', 45)
redis.call('SET', KEYS[4], '1', 'EX', 1800)
local ipCount = redis.call('INCR', KEYS[5])
if ipCount == 1 then redis.call('EXPIRE', KEYS[5], 3600) end
local dayCount = redis.call('INCR', KEYS[6])
if dayCount == 1 then redis.call('EXPIRE', KEYS[6], 172800) end
return {'send', ARGV[2]}
`;

export const FINISH_VISIT = `#!lua flags=allow-key-locking
if redis.call('GET', KEYS[1]) == ARGV[1] then
  if ARGV[2] == 'sent' then redis.call('SET', KEYS[2], '1', 'EX', 86400) end
  redis.call('DEL', KEYS[1])
end
return 1
`;
