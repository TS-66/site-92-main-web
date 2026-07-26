import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const incidents = await db.incident.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Public GET Incidents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
