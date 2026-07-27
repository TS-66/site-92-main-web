import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.testLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Public GET test logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test logs' },
      { status: 500 }
    );
  }
}