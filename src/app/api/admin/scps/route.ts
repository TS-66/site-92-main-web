import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const scps = await db.siteScp.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(scps);
  } catch (error) {
    console.error('Admin GET SCPs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SCPs' },
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
    const { scpId, name, objectClass, threat, zone, description, addedBy } = body;

    if (!scpId || !name || !objectClass || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: scpId, name, objectClass, description, addedBy' },
        { status: 400 }
      );
    }

    const scp = await db.siteScp.create({
      data: {
        scpId,
        name,
        objectClass,
        threat: threat || 'UNDETERMINED',
        zone: zone || 'STANDARD',
        description,
        addedBy: addedBy || 'admin',
      },
    });

    return NextResponse.json(scp, { status: 201 });
  } catch (error) {
    console.error('Admin POST SCP error:', error);
    return NextResponse.json(
      { error: 'Failed to create SCP' },
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
    await db.siteScp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}