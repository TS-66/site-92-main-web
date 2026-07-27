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

// Accepts EITHER a map of updates { "A-1": "NORMAL", "B-2": "CRITICAL" }
// OR a single pair { key, value }. All keys are upserted. Returns the full
// resulting status map so the client can refresh cleanly.
export async function PUT(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Normalize into a { key: value } map.
    const updates: Record<string, string> = {};
    if (typeof body === 'object' && body !== null) {
      if (typeof body.key === 'string' && body.value !== undefined) {
        updates[body.key] = String(body.value);
      } else {
        for (const [k, v] of Object.entries(body)) {
          if (typeof k === 'string' && v !== undefined) updates[k] = String(v);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: key/value (single) or a map of {key: value}' },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(updates)) {
      await db.siteStatus.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    // Return the full refreshed map.
    const records = await db.siteStatus.findMany();
    const kv: Record<string, string> = {};
    for (const r of records) kv[r.key] = r.value;
    return NextResponse.json(kv);
  } catch (error) {
    console.error('Admin PUT site status error:', error);
    return NextResponse.json(
      { error: 'Failed to update site status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/site-status?key=A-1  — remove a single status key.
export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Query param "key" is required' }, { status: 400 });
    }
    try {
      await db.siteStatus.delete({ where: { key } });
    } catch {
      // Already absent — treat as success (idempotent).
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE site status error:', error);
    return NextResponse.json({ error: 'Failed to delete site status' }, { status: 500 });
  }
}
