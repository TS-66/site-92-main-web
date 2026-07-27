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

// POST /api/admin/protocols  — create a new protocol.
export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const code = (body.code || '').toString().trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Missing required field: code' }, { status: 400 });
    }
    const existing = await db.siteProtocol.findUnique({ where: { code } }).catch(() => null);
    if (existing) {
      return NextResponse.json({ error: 'A protocol with that code already exists' }, { status: 409 });
    }
    const protocol = await db.siteProtocol.create({
      data: {
        code,
        name: body.name || code,
        target: body.target || 'SITE-WIDE',
        status: (body.status || 'STANDBY').toString().toUpperCase(),
        assignedTo: body.assignedTo || 'N/A',
        description: body.description || '',
      },
    });
    return NextResponse.json(protocol, { status: 201 });
  } catch (error) {
    console.error('Admin POST protocol error:', error);
    return NextResponse.json({ error: 'Failed to create protocol' }, { status: 500 });
  }
}

// DELETE /api/admin/protocols?code=ZETA-9
export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get('code') || '').toString().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Query param "code" is required' }, { status: 400 });
    }
    try {
      await db.siteProtocol.delete({ where: { code } });
    } catch {
      // Already absent — treat as success (idempotent).
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE protocol error:', error);
    return NextResponse.json({ error: 'Failed to delete protocol' }, { status: 500 });
  }
}