import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { projects } from '@/data/projects';
import {
  alertsEnabled, buildVisitEmail, FINISH_VISIT, parseVisit,
  RESERVE_VISIT, visitorHash,
} from '@/lib/visit-alerts';

export const runtime = 'nodejs';
export const maxDuration = 30;

function result(status: string, code = 200) {
  return Response.json({ status }, {
    status: code, headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: Request) {
  if (!alertsEnabled()) return result('disabled');
  const env = process.env;
  const recipient = env.VISIT_ALERT_EMAIL || env.CONTACT_EMAIL;
  const from = env.VISIT_ALERT_FROM || 'Portfolio Visits <onboarding@resend.dev>';
  if (!env.RESEND_API_KEY || !recipient || !env.UPSTASH_REDIS_REST_URL ||
      !env.UPSTASH_REDIS_REST_TOKEN || !env.VISIT_ALERT_HASH_SECRET ||
      env.VISIT_ALERT_HASH_SECRET.length < 32 || !env.VISIT_ALERT_SITE_URL) {
    console.error('[visit] Missing visit alert configuration; no email sent.');
    return result('unavailable', 503);
  }

  let origin: string;
  try { origin = new URL(env.VISIT_ALERT_SITE_URL).origin; }
  catch { return result('unavailable', 503); }
  if (req.headers.get('origin') !== origin ||
      (req.headers.get('sec-fetch-site') && req.headers.get('sec-fetch-site') !== 'same-origin')) {
    return result('forbidden', 403);
  }
  const ua = (req.headers.get('user-agent') || '').slice(0, 1024);
  if (!ua || /bot|crawler|spider|headless|preview|lighthouse|facebookexternalhit/i.test(ua)) {
    return result('ignored');
  }
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return result('invalid', 415);
  }
  // Read with a hard bound, even when Content-Length is omitted or forged.
  const reader = req.body?.getReader();
  if (!reader) return result('invalid', 400);
  let raw = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return result('invalid', 413);
      }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
  } catch { return result('invalid', 400); }
  let visit;
  try { visit = parseVisit(JSON.parse(raw)); }
  catch { return result('invalid', 400); }
  if (!visit) return result('invalid', 400);
  const project = visit.eventType === 'project_open' ? projects.find(p => p.id === visit.projectId) : undefined;
  if (visit.eventType === 'project_open' && !project) return result('invalid', 400);

  // Vercel overwrites this header. Never trust arbitrary client-supplied IP headers.
  const ip = req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim();
  if (!ip) return result('unavailable', 503);
  const day = new Date().toISOString().slice(0, 10); // Daily quota resets at UTC midnight.
  const secret = env.VISIT_ALERT_HASH_SECRET;
  const prefix = `portfolio-visits:${visitorHash(origin, secret, 'site')}:`;
  const projectScope = project ? `:project:${project.id}` : '';
  const eventKey = `${prefix}event:${visit.browserId}:${visit.eventId}${projectScope}`;
  const lockKey = `${eventKey}:lock`;
  const sentKey = `${eventKey}:sent`;
  const owner = randomUUID();
  const configuredCap = Number(env.VISIT_ALERT_DAILY_CAP || '50');
  if (!Number.isSafeInteger(configuredCap) || configuredCap < 1 || configuredCap > 1000) {
    return result('unavailable', 503);
  }
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: false,
    retry: false,
    signal: () => AbortSignal.timeout(3000),
  });
  try {
    const email = {
      from, to: recipient,
      ...buildVisitEmail(visit, ua, req.headers.get('x-vercel-ip-country'), project?.title),
    };
    const reservation = await redis.eval<[string, string, number, number], [string, string?]>(RESERVE_VISIT, [
      eventKey, sentKey, lockKey,
      `${prefix}browser:${visit.browserId}${projectScope}`,
      `${prefix}ip:${visitorHash(ip, secret, day)}${project ? ':project' : ''}`,
      `${prefix}day:${day}`,
    ], [owner, JSON.stringify(email), configuredCap, project ? 20 : 5]);
    if (reservation[0] === 'busy') return result('retry', 503);
    if (reservation[0] !== 'send') return result(reservation[0]);

    try {
      // The stored payload makes retries identical even after a configuration change.
      const payload = JSON.parse(reservation[1]!) as typeof email;
      const { error } = await new Resend(env.RESEND_API_KEY).emails.send(payload, {
        idempotencyKey: `portfolio-visit/${visitorHash(eventKey, secret, 'event')}`,
      });
      if (error) throw new Error('Email provider rejected visit alert');
      await redis.eval(FINISH_VISIT, [lockKey, sentKey], [owner, 'sent']);
      return result('sent');
    } catch {
      // Do not log visitor details, credentials, or the provider response.
      console.error('[visit] Email delivery or confirmation failed; safe to retry.');
      await redis.eval(FINISH_VISIT, [lockKey, sentKey], [owner, 'retry']);
      return result('retry', 503);
    }
  } catch {
    console.error('[visit] Shared visit store unavailable; no unprotected send attempted.');
    return result('unavailable', 503);
  }
}
