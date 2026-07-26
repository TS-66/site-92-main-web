import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCredential } from '@/lib/credentials';

/**
 * Public endpoint: request a terminal login key without Discord.
 *
 * Dedup by callsign — if the same callsign is used again, the SAME key is
 * returned (no duplicates). This uses the same atomic `getOrCreateCredential`
 * logic as the Discord bot button, so the guarantee is identical.
 *
 * The callsign is stored as `web:<callsign>` in the discordUserId column
 * (which is @unique), keeping it separate from Discord user IDs.
 */
export async function POST(req: NextRequest) {
  try {
    const { callsign } = await req.json();
    if (!callsign || typeof callsign !== 'string') {
      return NextResponse.json({ error: 'A callsign is required.' }, { status: 400 });
    }

    const clean = callsign.trim().slice(0, 32);
    if (!clean) {
      return NextResponse.json({ error: 'Callsign cannot be empty.' }, { status: 400 });
    }

    const identity = `web:${clean.toLowerCase()}`;
    const { credential, isNew } = await getOrCreateCredential(identity);

    return NextResponse.json({
      success: true,
      username: credential.username,
      password: credential.password,
      isNew,
      message: isNew ? 'New terminal login generated.' : 'Welcome back — here is your existing login.',
    });
  } catch (err) {
    console.error('[request-key] Failed:', err);
    return NextResponse.json({ error: 'Failed to generate key. Please try again.' }, { status: 500 });
  }
}
