import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const protocols = await db.siteProtocol.findMany();
    return NextResponse.json(protocols);
  } catch (error) {
    console.error('Public GET protocols error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500 }
    );
  }
}