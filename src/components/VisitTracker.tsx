'use client';

import { useEffect } from 'react';

const WINDOW_MS = 30 * 60 * 1000;
const PENDING_MS = 10 * 60 * 1000;
const STATE_KEY = 'portfolio:visit-alert:v1';
const IGNORE_KEY = 'portfolio:visit-alert:ignore';
type VisitState = {
  browserId: string; eventId: string; visitedAt: number;
  path: string; referrer: string; completed: boolean;
};
let memory: VisitState | null = null;
let inFlight = false;

function readState(): VisitState | null {
  try {
    const value = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    if (value && typeof value.browserId === 'string' && typeof value.eventId === 'string' &&
        typeof value.visitedAt === 'number' && typeof value.path === 'string' &&
        typeof value.referrer === 'string' && typeof value.completed === 'boolean') return value;
  } catch { /* Storage may be disabled; use this page's memory. */ }
  return memory;
}

function writeState(state: VisitState) {
  memory = state;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* Best effort. */ }
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

    const report = async () => {
      if (document.visibilityState !== 'visible' || inFlight) return;
      try {
        // Recheck so opting out in another tab also applies here.
        if (localStorage.getItem(IGNORE_KEY) === 'true') return;
      } catch { /* Best effort. */ }
      const now = Date.now();
      const previous = readState();
      const age = previous ? now - previous.visitedAt : Infinity;
      if (previous?.completed && age >= 0 && age < WINDOW_MS) return;
      const state: VisitState = previous && !previous.completed && age >= 0 && age < PENDING_MS ? previous : {
        browserId: previous?.browserId || crypto.randomUUID(),
        eventId: crypto.randomUUID(), visitedAt: now,
        path: window.location.pathname,
        // Only a hostname leaves the browser; query strings are never collected.
        referrer: document.referrer ? new URL(document.referrer).origin : '', completed: false,
      };
      writeState(state);
      inFlight = true;
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
              writeState({ ...state, completed: true });
              return;
            }
            if (response.status < 500 && response.status !== 429) return;
          } catch { /* Retry briefly; never interrupt the portfolio. */ }
        }
      } finally { inFlight = false; }
    };
    const onVisible = () => { void report().catch(() => {}); };
    onVisible();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [enabled]);
  return null;
}
