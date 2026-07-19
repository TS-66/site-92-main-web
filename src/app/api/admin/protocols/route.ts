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
    const { code, name, target, status, assignedTo, description } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required field: code' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (target !== undefined) updateData.target = target;
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (description !== undefined) updateData.description = description;

    const protocol = await db.siteProtocol.update({
      where: { code },
      data: updateData,
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