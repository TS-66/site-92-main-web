import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const records = await db.siteStatus.findMany();
    const kv: Record<string, string> = {};
    for (const r of records) {
      kv[r.key] = r.value;
    }
    return NextResponse.json(kv);
  } catch (error) {
    console.error('Public GET site status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site status' },
      { status: 500 }
    );
  }
}