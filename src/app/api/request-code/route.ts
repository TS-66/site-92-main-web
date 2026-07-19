import { NextRequest, NextResponse } from 'next/server';
import { setCode } from '@/lib/verification';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  setCode(username, code);

  // Forward to mini-service which sends the Discord DM
  try {
    const res = await fetch('http://localhost:3003/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.success) {
      return NextResponse.json({ success: true, message: 'Verification code sent via Discord DM.' });
    }
    return NextResponse.json({ error: data.error || 'Could not send code.' }, { status: 500 });
  } catch {
    // Mini-service not running — code stored locally, log it for testing
    console.log(`[SCiPNET] Verification code for ${username}: ${code} (mini-service offline, code logged)`);
    return NextResponse.json({ success: true, message: 'Code generated. (Discord bot offline — check server logs for code)' });
  }
}