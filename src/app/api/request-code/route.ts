import { NextRequest, NextResponse } from 'next/server';
import { setCode } from '@/lib/verification';
import { dmAdmins } from '@/lib/discord';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await setCode(username, code);

  const result = await dmAdmins(`Verification code for ${username}: ${code}`);
  if (result.sent.length > 0) {
    return NextResponse.json({ success: true, message: 'Verification code sent via Discord DM.' });
  }

  console.log(`[SCiPNET] Verification code for ${username}: ${code} (Discord DM failed, code logged)`);
  return NextResponse.json({ success: true, message: 'Code generated. (Discord DM failed — check server logs for code)' });
}