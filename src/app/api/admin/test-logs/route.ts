import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const logs = await db.testLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Admin GET test logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Accept both `scpRef` (DB field) and `scpReference` (legacy client field).
    const scpRef = (body.scpRef || body.scpReference || '').toString().trim();
    const { title, researchers, result, severity, addedBy } = body;

    if (!scpRef || !title || !researchers || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: scpRef (or scpReference), title, researchers, result' },
        { status: 400 }
      );
    }

    const log = await db.testLog.create({
      data: {
        scpRef,
        title,
        researchers,
        result,
        severity: severity || 'MINOR',
        addedBy: addedBy || 'admin',
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Admin POST test log error:', error);
    return NextResponse.json(
      { error: 'Failed to create test log' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/test-logs  body: { id, scpRef?, scpReference?, title?, researchers?, result?, severity? }
export async function PUT(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (body.scpRef || body.scpReference) data.scpRef = (body.scpRef || body.scpReference).toString().trim();
    if (body.title !== undefined) data.title = body.title;
    if (body.researchers !== undefined) data.researchers = body.researchers;
    if (body.result !== undefined) data.result = body.result;
    if (body.severity !== undefined) data.severity = body.severity;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const log = await db.testLog.update({ where: { id }, data });
    return NextResponse.json(log);
  } catch (error) {
    console.error('Admin PUT test log error:', error);
    return NextResponse.json({ error: 'Failed to update test log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    await db.testLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
