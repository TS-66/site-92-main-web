import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const reports = await db.anomalyReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Admin GET AnomalyReports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly reports' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/anomaly-reports  body: { id, status?, reporterName?, scpRef?, location?, description?, contact? }
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
    if (body.status !== undefined) data.status = body.status;
    if (body.reporterName !== undefined) data.reporterName = body.reporterName;
    if (body.scpRef !== undefined) data.scpRef = body.scpRef;
    if (body.location !== undefined) data.location = body.location;
    if (body.description !== undefined) data.description = body.description;
    if (body.contact !== undefined) data.contact = body.contact;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const report = await db.anomalyReport.update({ where: { id }, data });
    return NextResponse.json(report);
  } catch (error) {
    console.error('Admin PUT AnomalyReport error:', error);
    return NextResponse.json({ error: 'Failed to update anomaly report' }, { status: 500 });
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
    await db.anomalyReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE AnomalyReport error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
