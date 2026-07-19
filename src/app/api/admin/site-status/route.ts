import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const records = await db.siteStatus.findMany();
    const kv: Record<string, string> = {};
    for (const r of records) {
      kv[r.key] = r.value;
    }
    return NextResponse.json(kv);
  } catch (error) {
    console.error('Admin GET site status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value' },
        { status: 400 }
      );
    }

    const record = await db.siteStatus.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Admin PUT site status error:', error);
    return NextResponse.json(
      { error: 'Failed to update site status' },
      { status: 500 }
    );
  }
}