import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from '@/lib/persona';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Role = 'user' | 'ai';
type ChatMessage = { role: Role; text: string };

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;
// In-memory and process-local. Acceptable here because the route runs on
// Vercel serverless functions that recycle frequently. Replace with an
// external store (e.g. Upstash) if deploying to a long-lived server.
const buckets = new Map<string, { count: number; windowStart: number }>();

function clientIp(req: NextRequest): string {
  // Vercel injects this server-side and clients cannot spoof it. Falls back
  // to the rightmost x-forwarded-for entry (closest to our infra), then x-real-ip.
  const vercel = req.headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel.split(',')[0].trim();
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const parts = fwd.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  b.count += 1;
  return b.count > MAX_REQUESTS;
}

function fallbackReply(): string {
  return "I'm having trouble reaching my brain right now — try again in a moment.";
}

export async function POST(req: NextRequest) {
  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: fallbackReply() });
  }

  const rawMessage = body.message;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === 'object' &&
          (m.role === 'user' || m.role === 'ai') &&
          typeof m.text === 'string'
      )
    : [];
  if (!message) return NextResponse.json({ reply: fallbackReply() });

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({
      reply: "I've hit my rate limit for this visitor — try again in an hour.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY is not set');
    return NextResponse.json({ reply: fallbackReply() });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(),
      generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
    });

    const trimmed = history.slice(-12);
    const contents = trimmed.map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const result = await model.generateContent({ contents });
    const reply = result.response.text().trim() || fallbackReply();
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[chat] Gemini call failed:', err);
    return NextResponse.json({ reply: fallbackReply() });
  }
}
