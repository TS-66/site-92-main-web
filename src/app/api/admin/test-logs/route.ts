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
    const { scpRef, title, researchers, result, severity, addedBy } = body;

    if (!scpRef || !title || !researchers || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: scpRef, title, researchers, result, addedBy' },
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