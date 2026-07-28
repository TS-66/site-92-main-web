import { NextRequest, NextResponse } from 'next/server';

/**
 * Anti-cheat logging endpoint.
 * Receives reports from the client-side anti-cheat system when DevTools,
 * source inspection, or other tampering is detected. Logs to server console
 * for admin monitoring.
 *
 * Server-side rate limit: at most ONE log per event type per 60s to prevent
 * the dev.log from being flooded by repeat detections.
 *
 * Powered by The Duck Dev's | NexousCode Studios
 */

const lastLogged: Record<string, number> = {};
const RATE_LIMIT_MS = 60_000; // 60 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, ts, ua, url } = body;
    const ev = String(event || 'unknown');
    const now = Date.now();
    const last = lastLogged[ev] || 0;
    if (now - last >= RATE_LIMIT_MS) {
      lastLogged[ev] = now;
      console.warn(`[ANTI-CHEAT] ${ev} at ${new Date(ts || now).toISOString()} | URL: ${url || 'unknown'} | UA: ${(ua || '').substring(0, 100)}`);
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
