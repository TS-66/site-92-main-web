import { NextRequest, NextResponse } from 'next/server';

/**
 * Anti-cheat logging endpoint.
 * Receives reports from the client-side anti-cheat system when DevTools,
 * source inspection, or other tampering is detected. Logs to server console
 * for admin monitoring.
 *
 * Powered by The Duck Dev's | NexousCode Studios
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, ts, ua, url } = body;
    // Log to server console (visible in Vercel function logs / dev terminal)
    console.warn(`[ANTI-CHEAT] ${event} at ${new Date(ts || Date.now()).toISOString()} | URL: ${url || 'unknown'} | UA: ${(ua || '').substring(0, 100)}`);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
