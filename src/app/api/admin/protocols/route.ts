import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const protocols = await db.siteProtocol.findMany();
    return NextResponse.json(protocols);
  } catch (error) {
    console.error('Admin GET protocols error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
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
    // Frontend sends { id, status } where `id` is actually the protocol code
    // (protocols are keyed by `code`). Accept either `code` or `id`.
    const code = (body.code || body.id || '').toString().toUpperCase();
    const { name, target, status, assignedTo, description } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required field: code (or id)' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (target !== undefined) updateData.target = target;
    if (status !== undefined) updateData.status = status.toString().toUpperCase();
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (description !== undefined) updateData.description = description;

    const protocol = await db.siteProtocol.upsert({
      where: { code },
      update: updateData,
      create: {
        code,
        name: name || code,
        target: target || 'SITE-WIDE',
        status: status ? status.toString().toUpperCase() : 'STANDBY',
        assignedTo: assignedTo || 'N/A',
        description: description || '',
      },
    });

    return NextResponse.json(protocol);
  } catch (error) {
    console.error('Admin PUT protocol error:', error);
    return NextResponse.json(
      { error: 'Failed to update protocol' },
      { status: 500 }
    );
  }
}