import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const scps = await db.siteScp.findMany();
    return NextResponse.json(scps);
  } catch (error) {
    console.error('Public GET SCPs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SCPs' },
      { status: 500 }
    );
  }
}