'use client';

import { useEffect } from 'react';

const WINDOW_MS = 30 * 60 * 1000;
const PENDING_MS = 10 * 60 * 1000;
const STATE_KEY = 'portfolio:visit-alert:v1';
const IGNORE_KEY = 'portfolio:visit-alert:ignore';
type VisitState = {
  browserId: string; eventId: string; visitedAt: number;
  path: string; referrer: string; completed: boolean;
  eventType?: 'project_open'; projectId?: string;
};
const memory = new Map<string, VisitState>();
const inFlight = new Set<string>();

export function trackProjectOpen(projectId: string) {
  window.dispatchEvent(new CustomEvent('portfolio:project-open', { detail: { projectId } }));
}

function readState(key = STATE_KEY): VisitState | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (value && typeof value.browserId === 'string' && typeof value.eventId === 'string' &&
        typeof value.visitedAt === 'number' && typeof value.path === 'string' &&
        typeof value.referrer === 'string' && typeof value.completed === 'boolean') return value;
  } catch { /* Storage may be disabled; use this page's memory. */ }
  return memory.get(key) || null;
}

function writeState(state: VisitState, key = STATE_KEY) {
  memory.set(key, state);
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Best effort. */ }
}

export default function VisitTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let ignored = false;
    const url = new URL(window.location.href);
    const preference = url.searchParams.get('visit-alerts');
    try {
      if (preference === 'off') localStorage.setItem(IGNORE_KEY, 'true');
      if (preference === 'on') localStorage.removeItem(IGNORE_KEY);
      ignored = localStorage.getItem(IGNORE_KEY) === 'true';
    } catch { /* The URL opt-out still works for this page. */ }
    if (preference === 'off') ignored = true;
    if (preference === 'off' || preference === 'on') {
      url.searchParams.delete('visit-alerts');
      window.history.replaceState(window.history.state, '', url);
    }
    if (ignored) return;

    const report = async (projectId?: string) => {
      const key = projectId ? `${STATE_KEY}:project:${projectId}` : STATE_KEY;
      if (document.visibilityState !== 'visible' || inFlight.has(key)) return;
      try {
        // Recheck so opting out in another tab also applies here.
        if (localStorage.getItem(IGNORE_KEY) === 'true') return;
      } catch { /* Best effort. */ }
      const now = Date.now();
      const previous = readState(key);
      const age = previous ? now - previous.visitedAt : Infinity;
      if (previous?.completed && age >= 0 && age < WINDOW_MS) return;
      const state: VisitState = previous && !previous.completed && age >= 0 && age < PENDING_MS ? previous : {
        browserId: previous?.browserId || readState()?.browserId || crypto.randomUUID(),
        eventId: crypto.randomUUID(), visitedAt: now,
        path: window.location.pathname,
        // Only a hostname leaves the browser; query strings are never collected.
        referrer: document.referrer ? new URL(document.referrer).origin : '', completed: false,
        ...(projectId ? { eventType: 'project_open' as const, projectId } : {}),
      };
      writeState(state, key);
      inFlight.add(key);
      try {
        // Same event and payload on each attempt; the server/provider deduplicate.
        for (const delay of [0, 2000, 46_000]) {
          if (delay) await new Promise(resolve => window.setTimeout(resolve, delay));
          try {
            if (localStorage.getItem(IGNORE_KEY) === 'true') return;
          } catch { /* Best effort. */ }
          try {
            const response = await fetch('/api/visit', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state), credentials: 'same-origin',
              signal: AbortSignal.timeout(12_000),
            });
            if (response.ok) {
              writeState({ ...state, completed: true }, key);
              return;
            }
            if (response.status < 500 && response.status !== 429) return;
          } catch { /* Retry briefly; never interrupt the portfolio. */ }
        }
      } finally { inFlight.delete(key); }
    };
    const onVisible = () => { void report().catch(() => {}); };
    const onProjectOpen = (event: Event) => {
      const id: unknown = (event as CustomEvent<{ projectId?: unknown }>).detail?.projectId;
      if (typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id)) {
        void report(id).catch(() => {});
      }
    };
    onVisible();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('portfolio:project-open', onProjectOpen);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('portfolio:project-open', onProjectOpen);
    };
  }, [enabled]);
  return null;
}
