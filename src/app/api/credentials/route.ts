import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const creds = await db.credential.findMany();
    const credsObject: Record<string, string> = {};
    creds.forEach((c) => {
      credsObject[c.username] = c.password;
    });
    return NextResponse.json(credsObject);
  } catch {
    return NextResponse.json({ error: 'Failed to read credentials' }, { status: 500 });
  }
}